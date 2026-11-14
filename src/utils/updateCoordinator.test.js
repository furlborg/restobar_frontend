import test from "node:test";
import assert from "node:assert/strict";
import { createUpdateCoordinator, COORDINATOR_PHASE as P } from "./updateCoordinator.js";
import { DETECTOR_STATUS as S } from "./versionDetector.js";

const candidate = { releaseId: "bbbbbbbbbbbbbbbb", deploymentId: "20261114000000-bbbbbb", status: "ready" };
const available = { status: S.AVAILABLE, candidate, lastError: null };

const make = (over = {}) => {
  const calls = { revalidate: 0, barrier: 0, apply: [] };
  const deps = {
    revalidate: async () => {
      calls.revalidate += 1;
      return available;
    },
    isOnline: () => true,
    evaluateBarrier: () => {
      calls.barrier += 1;
      return { ok: true };
    },
    apply: async (c) => {
      calls.apply.push(c);
    },
    ...over,
  };
  return { coordinator: createUpdateCoordinator(deps), calls };
};

test("camino feliz: revalida, consulta la barrera y aplica la candidata revalidada", async () => {
  const { coordinator, calls } = make();
  const s = await coordinator.requestUpdate();
  assert.equal(calls.revalidate, 1);
  assert.equal(calls.barrier, 1);
  assert.deepEqual(calls.apply, [candidate]);
  assert.equal(s.phase, P.APPLYING);
});

test("CA04: pulsar varias veces emite una sola solicitud activa", async () => {
  let release;
  const { coordinator, calls } = make({
    revalidate: () =>
      new Promise((resolve) => {
        calls.revalidate += 1;
        release = () => resolve(available);
      }),
  });
  const p1 = coordinator.requestUpdate();
  const p2 = coordinator.requestUpdate();
  const p3 = coordinator.requestUpdate();
  assert.equal(p1, p2);
  assert.equal(p2, p3);
  assert.equal(coordinator.isBusy(), true);
  release();
  await p1;
  assert.equal(calls.revalidate, 1);
  assert.equal(calls.apply.length, 1);
  assert.equal(coordinator.isBusy(), false);
});

test("muestra 'comprobando' mientras revalida", async () => {
  let release;
  const { coordinator } = make({ revalidate: () => new Promise((r) => (release = () => r(available))) });
  const p = coordinator.requestUpdate();
  assert.equal(coordinator.getState().phase, P.CHECKING);
  release();
  await p;
});

test("sin red no revalida ni aplica", async () => {
  const { coordinator, calls } = make({ isOnline: () => false });
  const s = await coordinator.requestUpdate();
  assert.equal(s.phase, P.OFFLINE);
  assert.equal(calls.revalidate, 0);
  assert.equal(calls.apply.length, 0);
});

test("si la revalidación falla por red, no aplica la candidata vieja", async () => {
  const { coordinator, calls } = make({
    revalidate: async () => ({ status: S.AVAILABLE, candidate, lastError: "timeout" }),
  });
  const s = await coordinator.requestUpdate();
  assert.equal(s.phase, P.OFFLINE);
  assert.equal(calls.apply.length, 0);
});

test("si la revalidación devuelve algo inválido, es un fallo y no aplica", async () => {
  const { coordinator, calls } = make({
    revalidate: async () => ({ status: S.AVAILABLE, candidate, lastError: "not_json" }),
  });
  const s = await coordinator.requestUpdate();
  assert.equal(s.phase, P.FAILED);
  assert.equal(calls.apply.length, 0);
});

test("si revalidar lanza un error, es un fallo y no aplica", async () => {
  const { coordinator, calls } = make({
    revalidate: async () => {
      throw new Error("x");
    },
  });
  assert.equal((await coordinator.requestUpdate()).phase, P.FAILED);
  assert.equal(calls.apply.length, 0);
});

test("si al revalidar ya no hay versión nueva (rollback), vuelve a reposo sin aplicar", async () => {
  const { coordinator, calls } = make({
    revalidate: async () => ({ status: S.UP_TO_DATE, candidate: null, lastError: null }),
  });
  assert.equal((await coordinator.requestUpdate()).phase, P.IDLE);
  assert.equal(calls.barrier, 0);
  assert.equal(calls.apply.length, 0);
});

test("CA05: con trabajo sin guardar se bloquea con el motivo y no aplica", async () => {
  const { coordinator, calls } = make({ evaluateBarrier: () => ({ ok: false, reason: "unsaved" }) });
  const s = await coordinator.requestUpdate();
  assert.equal(s.phase, P.BLOCKED);
  assert.equal(s.reason, "unsaved");
  assert.equal(calls.apply.length, 0);
});

test("si la barrera falla al evaluarse, se bloquea: nunca recarga a ciegas", async () => {
  const { coordinator, calls } = make({
    evaluateBarrier: () => {
      throw new Error("x");
    },
  });
  const s = await coordinator.requestUpdate();
  assert.equal(s.phase, P.BLOCKED);
  assert.equal(s.reason, "barrier_error");
  assert.equal(calls.apply.length, 0);
});

test("si aplicar falla, queda en fallo con el motivo", async () => {
  const { coordinator } = make({
    apply: async () => {
      const e = new Error("x");
      e.code = "boot_timeout";
      throw e;
    },
  });
  const s = await coordinator.requestUpdate();
  assert.equal(s.phase, P.FAILED);
  assert.equal(s.reason, "boot_timeout");
});

test("si la barrera bloquea en el último instante (dentro de apply), se muestra como bloqueo", async () => {
  const { coordinator } = make({
    apply: async () => {
      const e = new Error("bloqueada");
      e.blockedReason = "payment";
      throw e;
    },
  });
  const s = await coordinator.requestUpdate();
  assert.equal(s.phase, P.BLOCKED);
  assert.equal(s.reason, "payment");
});

test("dismiss vuelve a reposo después de un bloqueo y permite reintentar", async () => {
  let blocked = true;
  const { coordinator, calls } = make({
    evaluateBarrier: () => (blocked ? { ok: false, reason: "unsaved" } : { ok: true }),
  });
  await coordinator.requestUpdate();
  coordinator.dismiss();
  assert.equal(coordinator.getState().phase, P.IDLE);
  blocked = false;
  await coordinator.requestUpdate();
  assert.equal(calls.apply.length, 1);
});

test("dismiss no interrumpe una solicitud en curso", async () => {
  let release;
  const { coordinator } = make({ revalidate: () => new Promise((r) => (release = () => r(available))) });
  const p = coordinator.requestUpdate();
  coordinator.dismiss();
  assert.equal(coordinator.getState().phase, P.CHECKING);
  release();
  await p;
});

test("los oyentes reciben cada fase", async () => {
  const { coordinator } = make();
  const phases = [];
  coordinator.subscribe((s) => phases.push(s.phase));
  await coordinator.requestUpdate();
  assert.deepEqual(phases, [P.CHECKING, P.APPLYING]);
});
