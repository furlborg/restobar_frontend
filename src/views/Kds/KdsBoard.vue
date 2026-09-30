<template>
  <div id="KdsBoard" class="kds-container" :class="['theme-' + currentTheme]">
    <!-- BARRA SUPERIOR / HEADER -->
    <header class="kds-header">
      <div class="header-left">
        <div class="kds-brand">
          <div class="brand-icon-wrap">
            <img :src="brandLogo" alt="Flizzy Logo" class="brand-logo-img" draggable="false" />
          </div>
          <div class="brand-info">
            <h1 class="brand-title">Comandas de Cocina</h1>
            <span class="brand-subtitle">Preparación de Pedidos</span>
          </div>
        </div>

        <!-- FILTROS SOLICITADOS: Todos, Pedidos Web, Autoservicio, Demorados, En Preparación -->
        <nav class="station-filters" aria-label="Filtros de comandas por tipo y urgencia">
          <button
            v-for="tab in stationTabs"
            :key="tab.id"
            class="station-chip"
            :class="[
              tab.id,
              { active: currentStation === tab.id }
            ]"
            :aria-pressed="currentStation === tab.id"
            @click="currentStation = tab.id"
          >
            <v-icon v-if="tab.icon" :name="tab.icon" scale="0.85" class="tab-icon" />
            <span class="station-name">{{ tab.name }}</span>
            <span
              class="station-count"
              :class="{ 'has-delayed': tab.id === 'delayed' && tab.count > 0 }"
              :aria-label="tab.count + ' pedidos'"
            >
              {{ tab.count }}
            </span>
          </button>
        </nav>
      </div>

      <div class="header-right">
        <!-- MÉTRICAS RÁPIDAS COMPACTAS -->
        <div class="metrics-bar" role="status" aria-label="Resumen de cocina">
          <div class="metric-item pending" title="Comandas pendientes">
            <span class="metric-dot"></span>
            <span class="metric-label">Pend:</span>
            <strong class="metric-val">{{ pendingCount }}</strong>
          </div>
          <div class="metric-item preparing" title="Comandas en preparación">
            <span class="metric-dot"></span>
            <span class="metric-label">Prep:</span>
            <strong class="metric-val">{{ preparingCount }}</strong>
          </div>
          <div v-if="delayedCount > 0" class="metric-item delayed" title="Comandas demoradas">
            <span class="metric-dot delayed-dot"></span>
            <span class="metric-label">Demoradas:</span>
            <strong class="metric-val delayed-val">{{ delayedCount }}</strong>
          </div>
        </div>

        <!-- RELOJ DIGITAL -->
        <div class="live-clock" role="timer" aria-label="Hora actual">
          <v-icon name="bi-clock-history" scale="0.95" class="clock-icon-svg" />
          <span class="clock-time">{{ currentTime }}</span>
        </div>

        <!-- BOTONES DE ACCIÓN RÁPIDA -->
        <div class="header-actions">
          <button
            class="action-btn icon-only-btn"
            :title="isFullscreen ? 'Salir de Pantalla Completa' : 'Pantalla Completa'"
            :aria-label="isFullscreen ? 'Salir de pantalla completa' : 'Activar pantalla completa'"
            @click="toggleFullscreen"
          >
            <v-icon :name="isFullscreen ? 'bi-fullscreen-exit' : 'bi-fullscreen'" scale="1.05" class="btn-svg" />
          </button>

          <button
            class="action-btn exit-btn"
            title="Volver al Sistema POS"
            aria-label="Volver al sistema POS"
            @click="exitKds"
          >
            <v-icon name="md-arrowback-round" scale="1.0" class="btn-svg" />
            <span>Salir</span>
          </button>
        </div>
      </div>
    </header>

    <!-- CUERPO PRINCIPAL / TABLERO DE COMANDAS -->
    <main ref="kdsBodyRef" class="kds-body" role="region" aria-label="Tablero de comandas activas">
      <!-- ESTADO VACÍO (SIN COMANDAS) -->
      <section v-if="filteredOrders.length === 0" class="kds-empty-state" aria-label="Sin pedidos">
        <div class="empty-card">
          <div class="empty-icon-wrap">
            <v-icon :name="currentStation === 'preparing' ? 'md-localfiredepartment-round' : 'md-restaurant-round'" scale="3.2" class="empty-icon-svg" />
          </div>
          <h2 class="empty-title">
            {{ currentStation === 'preparing' ? 'No hay comandas en preparación' : '¡Todo al día en cocina!' }}
          </h2>
          <p class="empty-desc">
            {{ currentStation === 'preparing' ? 'Inicia la preparación de alguna comanda pendiente para darle seguimiento aquí.' : 'No hay comandas pendientes en este momento. Los nuevos pedidos de Autoservicio, Salón o Delivery aparecerán aquí automáticamente.' }}
          </p>
          <div class="empty-badge">Auto-actualizando cada {{ refreshInterval }}s</div>
        </div>
      </section>

      <!-- MASONRY DE COLUMNAS (ESPACIO EXACTO DE 10PX HORIZONTAL Y VERTICAL SIN HUECOS) -->
      <div v-else class="orders-masonry">
        <div
          v-for="(col, colIdx) in orderColumns"
          :key="colIdx"
          class="masonry-column"
        >
          <article
            v-for="order in col"
            :key="order.order_id"
            class="order-card"
            :class="[
              getOrderAlertLevel(order),
              { 'is-preparing': order.status === '1' || order.status === 1 || order.isPreparing }
            ]"
            :aria-label="'Comanda ' + order.order_id"
          >
            <!-- CABECERA DE LA TARJETA (2 FILAS ESTRUCTURADAS) -->
            <div class="card-header">
              <!-- FILA 1: ID DE ORDEN Y TEMPORIZADOR EN VIVO (MÁXIMO ESPACIO, 0 COLISIONES) -->
              <div class="header-top-row">
                <div class="order-id-wrap">
                  <span class="order-hash">#</span>
                  <span class="order-number">{{ order.order_id }}</span>
                </div>
                <div
                  class="order-timer"
                  :class="getTimerClass(order.elapsedMinutes)"
                  role="timer"
                  :aria-label="'Tiempo transcurrido: ' + formatElapsed(order.elapsedSeconds)"
                >
                  <v-icon name="bi-clock-history" scale="0.75" class="timer-icon-svg" />
                  <span class="timer-text">{{ formatElapsed(order.elapsedSeconds) }}</span>
                </div>
              </div>

              <!-- FILA 2: BADGES DE ORIGEN, ESTADO Y METADATOS -->
              <div class="header-sub-row">
                <div class="tags-container">
                  <span class="order-origin-badge" :class="getOrderTypeClass(order.order_type)">
                    {{ getOrderBadgeText(order) }}
                  </span>
                  <span v-if="order.elapsedMinutes >= criticalThreshold" class="alert-status-badge critical" title="Demorado">
                    <span class="pulse-dot"></span>
                    <span>DEMORADO</span>
                  </span>
                  <span v-else-if="order.elapsedMinutes >= warningThreshold" class="alert-status-badge warning" title="Advertencia">
                    <span class="pulse-dot warning-dot"></span>
                    <span>ALERTA</span>
                  </span>
                  <span v-else-if="order.status === '1' || order.status === 1 || order.isPreparing" class="alert-status-badge preparing">
                    <span>EN PREP</span>
                  </span>
                  <span v-else class="alert-status-badge pending">
                    <span>PENDIENTE</span>
                  </span>
                </div>
                <div v-if="getOrderMetaText(order)" class="card-meta-line" :title="getOrderMetaText(order)">
                  <span>{{ getOrderMetaText(order) }}</span>
                </div>
              </div>
            </div>

            <!-- LISTA COMPACTA DE PLATILLOS (SEMÁNTICA UL / LI) -->
            <ul class="card-items-list" role="list">
              <li
                v-for="item in order.items"
                :key="item.id"
                class="item-row"
                :class="{ 'item-done': item.is_done }"
                role="checkbox"
                :aria-checked="item.is_done"
                tabindex="0"
                @click="toggleItemDone(item)"
                @keydown.space.prevent="toggleItemDone(item)"
                @keydown.enter.prevent="toggleItemDone(item)"
              >
                <div class="item-check">
                  <input
                    type="checkbox"
                    :checked="item.is_done"
                    tabindex="-1"
                    aria-hidden="true"
                    @click.stop="toggleItemDone(item)"
                  />
                </div>

                <div class="item-content">
                  <div class="item-title-line">
                    <span class="item-qty">{{ item.quantity }}x</span>
                    <span class="item-name">{{ item.product }}</span>
                    <span
                      v-if="item.preparation_place && item.preparation_place.toLowerCase() !== 'cocina'"
                      class="item-station-pill"
                    >
                      {{ item.preparation_place }}
                    </span>
                  </div>

                  <!-- INDICACIONES / DESGLOSE DE COMBOS -->
                  <div v-if="formatIndications(item.indication)" class="item-indications">
                    <span class="indication-prefix">↳</span>
                    <span class="indication-text">{{ formatIndications(item.indication) }}</span>
                  </div>
                </div>
              </li>
            </ul>

            <!-- PIE DE LA TARJETA / BOTÓN DE ACCIÓN ERGONÓMICO -->
            <div class="card-footer">
              <button
                v-if="order.status === '0' || order.status === 0"
                class="btn-action btn-start"
                :disabled="order.isProcessing"
                :aria-busy="order.isProcessing"
                @click="handleStartOrder(order)"
              >
                <v-icon name="md-localfiredepartment-round" scale="0.9" class="btn-action-icon" />
                <span>Iniciar Preparación</span>
              </button>

              <button
                v-else
                class="btn-action btn-dispatch"
                :disabled="order.isProcessing"
                :aria-busy="order.isProcessing"
                @click="handleDispatchOrder(order)"
              >
                <v-icon name="md-checkcircle-round" scale="0.9" class="btn-action-icon" />
                <span>Despachar Comanda</span>
              </button>
            </div>
          </article>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, onBeforeRouteLeave } from 'vue-router';
import axios from 'axios';
import logoFlizzy from '@/assets/images/flizzy-logo.png';
import {
  listProductPreparation,
  dispatchOrderPreparations,
  startOrderPreparations,
  updateProductPreparation,
} from '@/api/modules/orders';
import { useSettingsStore } from '@/store/modules/settings';

const router = useRouter();
const settingsStore = useSettingsStore();

// Parámetros de configuración (desde settings o defaults)
const kdsConfig = computed(() => {
  return settingsStore.businessSettings?.kds || {
    theme: 'dark',
    alert_warning_min: 8,
    alert_critical_min: 15,
    sound_new_order: true,
    sound_delayed_order: true,
    refresh_interval: 4,
  };
});

const refreshInterval = computed(() => kdsConfig.value.refresh_interval || 4);
const warningThreshold = computed(() => kdsConfig.value.alert_warning_min || 8);
const criticalThreshold = computed(() => kdsConfig.value.alert_critical_min || 15);

// Tema visual KDS (Controlado exclusivamente desde Configuración Avanzada)
const currentTheme = computed(() => {
  const storeTheme = settingsStore.businessSettings?.kds?.theme;
  if (storeTheme) return storeTheme;
  const localTheme = typeof localStorage !== 'undefined' ? localStorage.getItem('kds_theme') : null;
  if (localTheme) return localTheme;
  return 'dark';
});

// Estados reactivos
const brandLogo = ref(logoFlizzy);

// Cargar logo oficial del negocio si está en media, o usar logoFlizzy
if (typeof window !== 'undefined' && import.meta.env.VITE_APP_URL) {
  axios
    .get(`${import.meta.env.VITE_APP_URL}/media/business/logo.png`)
    .then((response) => {
      if (response.status === 200) {
        brandLogo.value = `${import.meta.env.VITE_APP_URL}/media/business/logo.png`;
      }
    })
    .catch(() => {
      brandLogo.value = logoFlizzy;
    });
}

const rawPreparations = ref([]);
const currentStation = ref('all');
const currentTime = ref('');
const isFullscreen = ref(false);
const soundEnabled = computed(() => kdsConfig.value?.sound_new_order !== false);
const checkedItems = ref(new Set()); // IDs de items tachados localmente
const uncheckedItems = ref(new Set()); // IDs de items desmarcados manualmente

const isItemDone = (prep) => {
  if (uncheckedItems.value.has(prep.id)) return false;
  if (checkedItems.value.has(prep.id)) return true;
  // Si el item ya está en preparación (status 1) o despachado (status 2), viene marcado por defecto
  if (prep.status === '1' || prep.status === 1 || prep.status === '2' || prep.status === 2) {
    return true;
  }
  return false;
};
const previousOrderIds = ref(new Set());
let isInitialLoad = true;
let lastCriticalAlertTime = 0;

// Reloj en vivo
let clockInterval = null;
let pollInterval = null;
let timerTickInterval = null;
const nowTimestamp = ref(Date.now());

const updateClock = () => {
  const d = new Date();
  currentTime.value = d.toLocaleTimeString('es-PE', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

// Motor de Audio Web API reutilizable y desbloqueable
let globalAudioCtx = null;
const getAudioContext = () => {
  if (!globalAudioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      globalAudioCtx = new AudioCtx();
    }
  }
  if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume().catch(() => {});
  }
  return globalAudioCtx;
};

// Desbloquear audio automáticamente con cualquier clic o toque
const unlockAudioOnGesture = () => {
  getAudioContext();
};

// Sintetizador Web Audio API para campanilla de restaurante (0 dependencias)
const playChimeSound = () => {
  if (!soundEnabled.value) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const playTone = (freq, startTime, duration, vol) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(vol, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    // Campanilla de restaurante nítida y agradable de 3 notas armónicas
    playTone(1046.50, now, 0.5, 0.45);
    playTone(1318.51, now + 0.12, 0.7, 0.4);
    playTone(1567.98, now + 0.25, 0.9, 0.35);
  } catch (e) {
    console.warn('No se pudo reproducir audio de comanda:', e);
  }
};

// Sonido para demora crítica (doble pitido de advertencia)
const playDelayedAlertSound = () => {
  if (!soundEnabled.value) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const playBeep = (freq, start) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.35, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.2);
    };

    playBeep(880, now);
    playBeep(880, now + 0.24);
  } catch (e) {
    console.warn('No se pudo reproducir alerta de demora:', e);
  }
};

// Sonido para tachar platillo (check rápido y agradable)
const playCheckSound = () => {
  if (!soundEnabled.value) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.08);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  } catch (e) {
    console.warn('Error audio check:', e);
  }
};

// Sonido al despachar comanda completa (acorde ascendente de éxito)
const playDispatchSuccessSound = () => {
  if (!soundEnabled.value) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const start = now + idx * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.35, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.35);
    });
  } catch (e) {
    console.warn('Error audio dispatch:', e);
  }
};

const testSound = () => {
  soundEnabled.value = true;
  playChimeSound();
};

// Cargar preparaciones desde la API
const loadPreparations = async () => {
  try {
    const res = await listProductPreparation();
    if (res && res.data) {
      // Filtrar preparaciones en cocina: solo comandas activas (excluir canceladas 3 y despachadas 2)
      const list = res.data.filter((p) => p.status !== 2 && p.status !== '2' && p.status !== 3 && p.status !== '3');
      
      // Detectar nuevos pedidos activos para sonar la campana
      const currentActiveIds = new Set(list.map((p) => p.order_id || p.id).filter(Boolean));
      
      if (isInitialLoad) {
        // En la primera carga al abrir la pantalla, registramos las órdenes existentes sin sonar
        previousOrderIds.value = currentActiveIds;
        isInitialLoad = false;
      } else {
        // En cada sondeo posterior: si detectamos CUALQUIER orden activa nueva
        let hasNew = false;
        for (const id of currentActiveIds) {
          if (!previousOrderIds.value.has(id)) {
            hasNew = true;
            break;
          }
        }

        if (hasNew && soundEnabled.value) {
          console.log('🛎️ [KDS] ¡NUEVA COMANDA DETECTADA! Reproduciendo campanilla...');
          playChimeSound();
        }

        previousOrderIds.value = currentActiveIds;
      }

      // Alerta sonora periódica si hay comandas críticas con retraso (solo activas)
      if (kdsConfig.value.sound_delayed_order && soundEnabled.value) {
        const hasCritical = list.some((p) => {
          if (!p.created_at) return false;
          const mins = (nowTimestamp.value - new Date(p.created_at).getTime()) / 60000;
          return mins >= criticalThreshold.value;
        });
        if (hasCritical && Date.now() - lastCriticalAlertTime > 60000) {
          lastCriticalAlertTime = Date.now();
          playDelayedAlertSound();
        }
      }
      rawPreparations.value = list;
    }
  } catch (err) {
    console.warn('Error polling KDS preparations:', err);
  }
};

// Agrupar preparaciones en Comandas (por order_id)
const activeGroupedOrders = computed(() => {
  const map = new Map();

  for (const prep of rawPreparations.value) {
    const orderId = prep.order_id || prep.id;
    if (!map.has(orderId)) {
      // Parsear fecha de creación
      let createdAtMs = nowTimestamp.value;
      if (prep.created_at) {
        createdAtMs = new Date(prep.created_at).getTime();
      }

      map.set(orderId, {
        order_id: orderId,
        order_type: prep.order_type || 'P',
        table: prep.table,
        area: prep.area,
        ask_for: prep.ask_for,
        user: prep.user,
        created_at_ms: createdAtMs,
        status: prep.status,
        items: [],
        stations: new Set(),
        isProcessing: false,
      });
    }

    const orderObj = map.get(orderId);
    if (prep.preparation_place) {
      orderObj.stations.add(prep.preparation_place);
    }

    // Si algún item está pendiente ('0'), o en preparación ('1')
    if (prep.status === '0' || prep.status === 0) {
      orderObj.status = '0';
    } else if (orderObj.status !== '0' && (prep.status === '1' || prep.status === 1)) {
      orderObj.status = '1';
    }

    orderObj.items.push({
      id: prep.id,
      product: prep.product,
      quantity: prep.quantity || 1,
      indication: prep.indication,
      status: prep.status,
      preparation_place: prep.preparation_place,
      preparation_place_id: prep.preparation_place_id,
      is_done: isItemDone(prep),
    });
  }

  // Convertir a arreglo y calcular tiempos transcurridos
  const orders = Array.from(map.values()).map((ord) => {
    const elapsedSeconds = Math.max(0, Math.floor((nowTimestamp.value - ord.created_at_ms) / 1000));
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    const isPreparing = ord.status === '1' || ord.status === 1 || ord.items.some((it) => it.status === '1' || it.status === 1);
    return {
      ...ord,
      elapsedSeconds,
      elapsedMinutes,
      isPreparing,
    };
  });

  // Ordenar: pedidos pendientes primero, luego los más antiguos arriba (FIFO)
  return orders.sort((a, b) => {
    if (a.status === '0' && b.status !== '0') return -1;
    if (a.status !== '0' && b.status === '0') return 1;
    return b.elapsedSeconds - a.elapsedSeconds;
  });
});

// Criterios de filtrado de los 5 grupos: Todos, Pedidos Web, Autoservicio, Demorados, En Preparación
const isWebOrder = (o) => {
  return o.order_type === 'M' || o.order_type === 'D' || (o.table !== null && o.table !== undefined && o.table !== '');
};

const isKioskOrder = (o) => {
  return o.order_type === 'P' && (o.table === null || o.table === undefined || o.table === '');
};

const isDelayedOrder = (o) => {
  if (o.elapsedMinutes >= warningThreshold.value || o.elapsedMinutes >= criticalThreshold.value) return true;
  if (o.ask_for && /urgente|prioridad/i.test(o.ask_for)) return true;
  if (o.items && o.items.some((it) => it.indication && /urgente|prioridad/i.test(it.indication))) return true;
  return false;
};

const isPreparingOrder = (o) => {
  return o.isPreparing || o.status === '1' || o.status === 1 || (o.items && o.items.some((it) => it.status === '1' || it.status === 1));
};

// Los 5 filtros principales: Todos, Pedidos Web, Autoservicio, Demorados, En Preparación
const stationTabs = computed(() => {
  const activeList = activeGroupedOrders.value;
  return [
    { id: 'all', name: 'Todos', count: activeList.length, icon: 'md-listalt-round' },
    { id: 'web', name: 'Pedidos Web', count: activeList.filter(isWebOrder).length, icon: 'md-restaurant-round' },
    { id: 'kiosk', name: 'Autoservicio', count: activeList.filter(isKioskOrder).length, icon: 'io-bag' },
    { id: 'delayed', name: 'Demorados', count: activeList.filter(isDelayedOrder).length, icon: 'md-warningamber-round' },
    { id: 'preparing', name: 'En Preparación', count: activeList.filter(isPreparingOrder).length, icon: 'md-localfiredepartment-round' },
  ];
});

// Filtrar comandas según la pestaña activa
const filteredOrders = computed(() => {
  switch (currentStation.value) {
    case 'web':
      return activeGroupedOrders.value.filter(isWebOrder);
    case 'kiosk':
      return activeGroupedOrders.value.filter(isKioskOrder);
    case 'delayed':
      return activeGroupedOrders.value.filter(isDelayedOrder);
    case 'preparing':
      return activeGroupedOrders.value.filter(isPreparingOrder);
    case 'all':
    default:
      return activeGroupedOrders.value;
  }
});

// Distribución Masonry en columnas dinámicas para eliminar el espacio vertical muerto
const kdsBodyRef = ref(null);
const containerWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1200);

const updateContainerWidth = () => {
  if (kdsBodyRef.value) {
    containerWidth.value = kdsBodyRef.value.clientWidth;
  } else if (typeof window !== 'undefined') {
    containerWidth.value = window.innerWidth;
  }
};

const columnCount = computed(() => {
  const available = Math.max(300, (containerWidth.value || 1200) - 20);
  // Ancho óptimo de columna entre 250px y 270px con gap de 10px
  const cols = Math.floor((available + 10) / (260 + 10));
  return Math.max(1, cols);
});

const orderColumns = computed(() => {
  const cols = columnCount.value;
  const result = Array.from({ length: cols }, () => []);
  const list = filteredOrders.value;

  list.forEach((order, idx) => {
    result[idx % cols].push(order);
  });

  return result;
});

// Métricas del Header
const pendingCount = computed(() => {
  return rawPreparations.value.filter((p) => p.status === '0' || p.status === 0).length;
});

const preparingCount = computed(() => {
  return rawPreparations.value.filter((p) => p.status === '1' || p.status === 1).length;
});

const avgPreparationTime = computed(() => {
  if (activeGroupedOrders.value.length === 0) return '0.0';
  const totalMin = activeGroupedOrders.value.reduce((acc, o) => acc + o.elapsedMinutes, 0);
  return (totalMin / activeGroupedOrders.value.length).toFixed(1);
});

// Formatear tiempo transcurrido (MM:SS)
const formatElapsed = (totalSeconds) => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

// Formatear indicaciones de preparación (admite strings, objetos y arrays)
const formatIndications = (indication) => {
  if (!indication) return '';
  if (typeof indication === 'string') return indication;
  if (Array.isArray(indication)) {
    return indication
      .map((i) => (typeof i === 'object' && i ? i.description || i.name : String(i)))
      .filter(Boolean)
      .join(', ');
  }
  if (typeof indication === 'object') {
    return indication.description || indication.name || '';
  }
  return '';
};

// Texto del badge de origen
const getOrderBadgeText = (order) => {
  if (order.table) {
    return `Mesa ${order.table}`;
  }
  if (order.order_type === 'P') {
    return 'Autoservicio';
  }
  if (order.order_type === 'D') {
    return 'Delivery';
  }
  if (order.area) {
    return order.area;
  }
  return 'Salón';
};

// Metadatos de la comanda (Área, Mozo, Cliente) en una sola línea sutil
const getOrderMetaText = (order) => {
  const parts = [];
  if (order.area) {
    parts.push(order.area);
  }
  if (order.user) {
    parts.push(`Mozo: ${order.user}`);
  }
  if (order.ask_for) {
    parts.push(`Cliente: ${order.ask_for}`);
  }
  return parts.join(' • ');
};

const getOrderTypeClass = (type) => {
  if (type === 'P') return 'badge-takeaway';
  if (type === 'M') return 'badge-salon';
  if (type === 'D') return 'badge-delivery';
  return 'badge-takeaway';
};

// Clases de alerta por tiempo (Verde, Ámbar, Rojo suave)
const getTimerClass = (elapsedMinutes) => {
  if (elapsedMinutes >= criticalThreshold.value) return 'timer-critical';
  if (elapsedMinutes >= warningThreshold.value) return 'timer-warning';
  return 'timer-normal';
};

const getOrderAlertLevel = (order) => {
  if (order.elapsedMinutes >= criticalThreshold.value) return 'alert-critical';
  if (order.elapsedMinutes >= warningThreshold.value) return 'alert-warning';
  return 'alert-normal';
};

// Toggle checkbox de producto listo
const toggleItemDone = async (item) => {
  if (item.is_done) {
    // Si ya tiene check, desmarcarlo
    item.is_done = false;
    checkedItems.value.delete(item.id);
    uncheckedItems.value.add(item.id);
  } else {
    // Si no tiene check, marcarlo
    item.is_done = true;
    uncheckedItems.value.delete(item.id);
    checkedItems.value.add(item.id);
    playCheckSound(); // 🔔 Suena al marcar platillo listo
    // Si el item estaba pendiente (0), actualizar status en backend a preparando (1)
    if (item.status === '0' || item.status === 0) {
      try {
        await updateProductPreparation(item.id, 1);
        item.status = 1;
      } catch (e) {
        console.warn(e);
      }
    }
  }
};

// Iniciar comanda completa
const handleStartOrder = async (order) => {
  order.isProcessing = true;
  // Al pasar a preparación ("Despachar Comanda"), marcar automáticamente todos los productos con check
  for (const item of order.items) {
    item.status = 1;
    item.is_done = true;
    uncheckedItems.value.delete(item.id);
    checkedItems.value.add(item.id);
  }
  order.status = '1';

  try {
    await startOrderPreparations(order.order_id);
  } catch (err) {
    console.error('Error starting order:', err);
  } finally {
    order.isProcessing = false;
    await loadPreparations();
  }
};

// Despachar comanda completa
const handleDispatchOrder = async (order) => {
  order.isProcessing = true;
  playDispatchSuccessSound(); // 🚀 Suena campanilla de despacho exitoso
  if (order.items) {
    for (const item of order.items) {
      checkedItems.value.delete(item.id);
      uncheckedItems.value.delete(item.id);
    }
  }
  try {
    await dispatchOrderPreparations(order.order_id);
    // Remover inmediatamente de la vista de cocina
    rawPreparations.value = rawPreparations.value.filter((p) => p.order_id !== order.order_id);
  } catch (err) {
    console.error('Error dispatching order:', err);
  } finally {
    order.isProcessing = false;
    await loadPreparations();
  }
};

const delayedCount = computed(() => {
  return activeGroupedOrders.value.filter((o) => o.elapsedMinutes >= criticalThreshold.value).length;
});

// Controles de cabecera y pantalla completa aislada para KDS
let isExitingKds = false;

const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement;
  // Si el usuario sale manualmente con tecla Escape dentro del KDS
  if (!document.fullscreenElement && !isExitingKds) {
    try {
      localStorage.setItem('kds_fullscreen_preferred', 'false');
    } catch (e) {}
  }
};

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    try {
      localStorage.setItem('kds_fullscreen_preferred', 'true');
    } catch (e) {}
    document.documentElement.requestFullscreen().catch(() => {});
    isFullscreen.value = true;
  } else {
    try {
      localStorage.setItem('kds_fullscreen_preferred', 'false');
    } catch (e) {}
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
      isFullscreen.value = false;
    }
  }
};

// Salir de pantalla completa para que NO afecte al resto del sistema POS fuera del KDS
const exitFullscreenIfActive = () => {
  isExitingKds = true;
  if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
  }
  isFullscreen.value = false;
};

const exitKds = () => {
  exitFullscreenIfActive();
  router.push({ path: '/' });
};

// Al cambiar de ruta desde el router, restaurar pantalla normal para que no afecte fuera
onBeforeRouteLeave(() => {
  exitFullscreenIfActive();
});

// Ciclos de vida
let resizeObserver = null;

onMounted(() => {
  window.addEventListener('click', unlockAudioOnGesture, { once: true });
  window.addEventListener('touchstart', unlockAudioOnGesture, { once: true });
  updateClock();
  clockInterval = setInterval(updateClock, 1000);

  // Escuchar cambios nativos de pantalla completa
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  isFullscreen.value = !!document.fullscreenElement;

  // Restaurar pantalla completa automáticamente SOLO dentro del KDS si estaba activada
  try {
    const isPreferred = localStorage.getItem('kds_fullscreen_preferred') === 'true';
    if (isPreferred && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        // En caso de que el navegador exija gesto previo (ej. al recargar con F5)
        const triggerFullscreenOnGesture = () => {
          if (localStorage.getItem('kds_fullscreen_preferred') === 'true' && !document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
          }
          window.removeEventListener('click', triggerFullscreenOnGesture);
          window.removeEventListener('touchstart', triggerFullscreenOnGesture);
        };
        window.addEventListener('click', triggerFullscreenOnGesture, { once: true });
        window.addEventListener('touchstart', triggerFullscreenOnGesture, { once: true });
      });
    }
  } catch (e) {}

  // Actualizar timestamps cada segundo para refrescar los temporizadores
  timerTickInterval = setInterval(() => {
    nowTimestamp.value = Date.now();
  }, 1000);

  // Cargar datos y programar polling
  loadPreparations();
  pollInterval = setInterval(loadPreparations, refreshInterval.value * 1000);

  // Observar redimensionamiento del contenedor para recalcular columnas Masonry
  updateContainerWidth();
  window.addEventListener('resize', updateContainerWidth);
  if (kdsBodyRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(updateContainerWidth);
    resizeObserver.observe(kdsBodyRef.value);
  }
});

onUnmounted(() => {
  // Asegurar que al salir/desmontar el KDS, la pantalla completa se apague y no afecte fuera
  exitFullscreenIfActive();
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
  window.removeEventListener('click', unlockAudioOnGesture);
  window.removeEventListener('touchstart', unlockAudioOnGesture);
  window.removeEventListener('resize', updateContainerWidth);
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  if (clockInterval) clearInterval(clockInterval);
  if (pollInterval) clearInterval(pollInterval);
  if (timerTickInterval) clearInterval(timerTickInterval);
});
</script>

<style scoped lang="scss">
@use './kds-board.scss' as *;
</style>
