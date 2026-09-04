<template>
  <div id="KdsBoard" class="kds-container">
    <!-- BARRA SUPERIOR / HEADER -->
    <header class="kds-header">
      <div class="header-left">
        <div class="kds-brand">
          <div class="brand-icon-wrap">
            <v-icon name="md-soupkitchen-round" scale="1.3" class="brand-icon-svg" />
          </div>
          <div class="brand-info">
            <h1 class="brand-title">Flizzy KDS</h1>
            <span class="brand-subtitle">Pantalla de Cocina</span>
          </div>
        </div>

        <!-- FILTROS POR ESTACIÓN / LUGAR DE PREPARACIÓN -->
        <div class="station-filters">
          <button
            v-for="station in stationTabs"
            :key="station.id"
            class="station-chip"
            :class="{ active: currentStation === station.id }"
            @click="currentStation = station.id"
          >
            <span class="station-name">{{ station.name }}</span>
            <span class="station-count">{{ station.count }}</span>
          </button>
        </div>
      </div>

      <div class="header-right">
        <!-- MÉTRICAS RÁPIDAS COMPACTAS -->
        <div class="metrics-bar">
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
        <div class="live-clock">
          <v-icon name="bi-clock-history" scale="0.95" class="clock-icon-svg" />
          <span class="clock-time">{{ currentTime }}</span>
        </div>

        <!-- BOTONES DE ACCIÓN RÁPIDA -->
        <div class="header-actions">
          <button
            class="action-btn sound-btn"
            :class="{ muted: !soundEnabled }"
            :title="soundEnabled ? 'Silenciar sonidos de cocina' : 'Activar sonido de comanda'"
            @click="toggleSound"
          >
            <v-icon :name="soundEnabled ? 'md-volumeup-round' : 'md-volumeoff-round'" scale="1.0" class="btn-svg" />
            <span>{{ soundEnabled ? 'Sonido' : 'Mudo' }}</span>
          </button>

          <button
            class="action-btn test-btn"
            title="Probar sonido de campanilla"
            @click="testSound"
          >
            <v-icon name="md-notificationsactive-round" scale="1.0" class="btn-svg" />
            <span>Probar</span>
          </button>

          <button
            class="action-btn icon-only-btn"
            :title="isFullscreen ? 'Salir de Pantalla Completa' : 'Pantalla Completa'"
            @click="toggleFullscreen"
          >
            <v-icon :name="isFullscreen ? 'bi-fullscreen-exit' : 'bi-fullscreen'" scale="1.05" class="btn-svg" />
          </button>

          <button
            class="action-btn exit-btn"
            title="Volver al Sistema POS"
            @click="exitKds"
          >
            <v-icon name="md-arrowback-round" scale="1.0" class="btn-svg" />
            <span>Salir</span>
          </button>
        </div>
      </div>
    </header>

    <!-- CUERPO PRINCIPAL / TABLERO DE COMANDAS -->
    <main class="kds-body">
      <!-- ESTADO VACÍO (SIN COMANDAS PENDIENTES) -->
      <div v-if="filteredOrders.length === 0" class="kds-empty-state">
        <div class="empty-card">
          <div class="empty-icon-wrap">
            <v-icon name="md-soupkitchen-round" scale="3.2" class="empty-icon-svg" />
          </div>
          <h2 class="empty-title">¡Todo al día en cocina!</h2>
          <p class="empty-desc">
            No hay comandas pendientes en este momento. Los nuevos pedidos de Autoservicio, Salón o Delivery aparecerán aquí automáticamente.
          </p>
          <div class="empty-badge">Auto-actualizando cada {{ refreshInterval }}s</div>
        </div>
      </div>

      <!-- GRID DE TARJETAS DE COMANDAS -->
      <div v-else class="orders-grid">
        <article
          v-for="order in filteredOrders"
          :key="order.order_id"
          class="order-card"
          :class="[
            getOrderAlertLevel(order),
            { 'is-preparing': order.status === '1' }
          ]"
        >
          <!-- CABECERA DE LA TARJETA -->
          <div class="card-header">
            <div class="order-identity">
              <span class="order-number">#{{ order.order_id }}</span>
              <span class="order-badge" :class="getOrderTypeClass(order.order_type)">
                {{ getOrderTypeLabel(order) }}
              </span>
              <span v-if="order.elapsedMinutes >= criticalThreshold" class="alert-badge critical">
                <v-icon name="md-warningamber-round" scale="0.85" />
                <span>Demorado</span>
              </span>
              <span v-else-if="order.elapsedMinutes >= warningThreshold" class="alert-badge warning">
                <v-icon name="md-warningamber-round" scale="0.85" />
                <span>Demorado</span>
              </span>
            </div>

            <!-- TEMPORIZADOR EN VIVO -->
            <div class="order-timer" :class="getTimerClass(order.elapsedMinutes)">
              <v-icon name="bi-clock-history" scale="0.85" class="timer-icon-svg" />
              <span class="timer-text">{{ formatElapsed(order.elapsedSeconds) }}</span>
            </div>
          </div>

          <!-- SUB-INFO: SALÓN / ÁREA / CLIENTE / MOZO -->
          <div class="card-subinfo">
            <span v-if="order.area" class="subinfo-item area">
              <v-icon name="io-business" scale="0.85" class="subinfo-icon text-primary" />
              <strong>{{ order.area }}</strong>
            </span>
            <span v-if="order.table" class="subinfo-item table">
              <v-icon name="md-locationon-round" scale="0.85" class="subinfo-icon text-primary" />
              <strong>{{ order.table }}</strong>
            </span>
            <span v-if="order.ask_for" class="subinfo-item customer">
              <v-icon name="hi-user" scale="0.85" class="subinfo-icon text-muted" />
              <span>{{ order.ask_for }}</span>
            </span>
            <span v-if="order.user" class="subinfo-item server">
              <v-icon name="md-badge-round" scale="0.85" class="subinfo-icon text-muted" />
              <span>{{ order.user }}</span>
            </span>
          </div>

          <!-- LISTA DE PRODUCTOS DE LA COMANDA -->
          <div class="card-items-list">
            <div
              v-for="item in order.items"
              :key="item.id"
              class="item-row"
              :class="{ 'item-done': item.is_done }"
              @click="toggleItemDone(item)"
            >
              <div class="item-check">
                <input
                  type="checkbox"
                  :checked="item.is_done"
                  @click.stop="toggleItemDone(item)"
                />
              </div>

              <div class="item-content">
                <div class="item-title-line">
                  <span class="item-qty">{{ item.quantity }}x</span>
                  <span class="item-name">{{ item.product }}</span>
                  <span v-if="item.preparation_place" class="station-tag">
                    {{ item.preparation_place }}
                  </span>
                </div>

                <!-- INDICACIONES / MODIFICADORES -->
                <div v-if="formatIndications(item.indication)" class="item-indications">
                  <v-icon name="md-bolt-round" scale="0.85" class="indication-icon-svg" />
                  <span class="indication-text">{{ formatIndications(item.indication) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- PIE DE LA TARJETA / BOTÓN DE ACCIÓN -->
          <div class="card-footer">
            <button
              v-if="order.status === '0' || order.status === 0"
              class="btn-action btn-start"
              :disabled="order.isProcessing"
              @click="handleStartOrder(order)"
            >
              <v-icon name="md-localfiredepartment-round" scale="1.05" class="btn-action-icon" />
              <span>Iniciar Preparación</span>
            </button>

            <button
              v-else
              class="btn-action btn-dispatch"
              :disabled="order.isProcessing"
              @click="handleDispatchOrder(order)"
            >
              <v-icon name="md-checkcircle-round" scale="1.05" class="btn-action-icon" />
              <span>Despachar Comanda</span>
            </button>
          </div>
        </article>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
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

// Estados reactivos
const rawPreparations = ref([]);
const currentStation = ref('all');
const currentTime = ref('');
const isFullscreen = ref(false);
const soundEnabled = ref(kdsConfig.value.sound_new_order !== false);
const checkedItems = ref(new Set()); // IDs de items tachados localmente
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
      // Filtrar preparaciones excluyendo las que ya están entregadas (status=3)
      const list = res.data.filter((p) => p.status !== 3 && p.status !== '3');
      
      // Detectar nuevos pedidos para sonar la campana
      const currentIds = new Set(list.map((p) => p.order_id || p.id).filter(Boolean));
      
      if (isInitialLoad) {
        // En la primera carga al abrir la pantalla, registramos las órdenes existentes sin sonar
        previousOrderIds.value = currentIds;
        isInitialLoad = false;
      } else {
        // En cada sondeo posterior: si detectamos CUALQUIER orden nueva
        let hasNew = false;
        for (const id of currentIds) {
          if (!previousOrderIds.value.has(id)) {
            hasNew = true;
            break;
          }
        }

        if (hasNew && soundEnabled.value) {
          console.log('🛎️ [KDS] ¡NUEVA COMANDA DETECTADA! Reproduciendo campanilla...');
          playChimeSound();
        }

        previousOrderIds.value = currentIds;
      }

      // Alerta sonora periódica si hay comandas críticas con retraso
      if (kdsConfig.value.sound_delayed_order && soundEnabled.value) {
        const hasCritical = list.some((p) => {
          if (!p.created_at) return false;
          const mins = (nowTimestamp.value - new Date(p.created_at).getTime()) / 60000;
          return mins >= criticalThreshold.value && p.status !== 2 && p.status !== '2';
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
const groupedOrders = computed(() => {
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
        status: prep.status, // Tomamos el menor o más prioritario
        items: [],
        stations: new Set(),
        isProcessing: false,
      });
    }

    const orderObj = map.get(orderId);
    if (prep.preparation_place) {
      orderObj.stations.add(prep.preparation_place);
    }

    // Si algún item está pendiente ('0'), la comanda general se marca como pendiente
    if (prep.status === '0' || prep.status === 0) {
      orderObj.status = '0';
    }

    orderObj.items.push({
      id: prep.id,
      product: prep.product,
      quantity: prep.quantity || 1,
      indication: prep.indication,
      status: prep.status,
      preparation_place: prep.preparation_place,
      preparation_place_id: prep.preparation_place_id,
      is_done: checkedItems.value.has(prep.id) || prep.status === '2' || prep.status === 2,
    });
  }

  // Convertir a arreglo y calcular tiempos transcurridos
  const orders = Array.from(map.values()).map((ord) => {
    const elapsedSeconds = Math.max(0, Math.floor((nowTimestamp.value - ord.created_at_ms) / 1000));
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    return {
      ...ord,
      elapsedSeconds,
      elapsedMinutes,
    };
  });

  // En el tablero activo de cocina, solo mostrar pedidos que tengan platillos pendientes o en preparación
  const activeOrders = orders.filter((ord) => {
    return ord.items.some((it) => it.status !== '2' && it.status !== 2 && it.status !== '3' && it.status !== 3);
  });

  // Ordenar: pedidos pendientes primero, luego los más antiguos arriba (FIFO)
  return activeOrders.sort((a, b) => {
    if (a.status === '0' && b.status !== '0') return -1;
    if (a.status !== '0' && b.status === '0') return 1;
    return b.elapsedSeconds - a.elapsedSeconds;
  });
});

// Filtros limpios y directos: Todas, Autoservicio y Áreas de Salón (Área Principal, Terraza)
const stationTabs = computed(() => {
  const tabs = [];

  // 1. Pestaña "Todas"
  tabs.push({
    id: 'all',
    name: 'Todas',
    count: groupedOrders.value.length,
    type: 'all',
  });

  // 2. Pedidos de Autoservicio / Quiosco / Llevar
  const takeawayOrders = groupedOrders.value.filter((o) => o.order_type === 'P');
  if (takeawayOrders.length > 0) {
    tabs.push({
      id: 'type_takeaway',
      name: 'Autoservicio',
      count: takeawayOrders.length,
      type: 'order_type',
      targetType: 'P',
    });
  }

  // 3. Salón / Áreas de la Web (Área Principal, Terraza, etc.)
  const salonOrders = groupedOrders.value.filter((o) => o.order_type === 'M');
  if (salonOrders.length > 0) {
    const areaCounts = new Map();
    for (const ord of salonOrders) {
      let areaName = (ord.area || 'Principal').trim();
      if (areaName.toUpperCase() === 'PRINCIPAL') {
        areaName = 'Área Principal';
      } else {
        areaName = areaName.charAt(0).toUpperCase() + areaName.slice(1).toLowerCase();
      }
      areaCounts.set(areaName, (areaCounts.get(areaName) || 0) + 1);
    }

    for (const [areaName, count] of areaCounts.entries()) {
      tabs.push({
        id: `area_${areaName.toLowerCase().replace(/\s+/g, '_')}`,
        name: areaName,
        count,
        type: 'area',
        targetArea: areaName.toLowerCase(),
      });
    }
  }

  // 4. Delivery (si hubiera órdenes de delivery activas)
  const deliveryOrders = groupedOrders.value.filter((o) => o.order_type === 'D');
  if (deliveryOrders.length > 0) {
    tabs.push({
      id: 'type_delivery',
      name: 'Delivery',
      count: deliveryOrders.length,
      type: 'order_type',
      targetType: 'D',
    });
  }

  return tabs;
});

// Filtrar comandas según la pestaña activa
const filteredOrders = computed(() => {
  if (currentStation.value === 'all') {
    return groupedOrders.value;
  }

  const activeTab = stationTabs.value.find((t) => t.id === currentStation.value);
  if (!activeTab) return groupedOrders.value;

  if (activeTab.type === 'order_type') {
    return groupedOrders.value.filter((o) => o.order_type === activeTab.targetType);
  }

  if (activeTab.type === 'area') {
    return groupedOrders.value.filter((o) => {
      let ordArea = (o.area || 'Principal').trim();
      if (ordArea.toUpperCase() === 'PRINCIPAL') {
        ordArea = 'Área Principal';
      }
      return ordArea.toLowerCase() === activeTab.targetArea;
    });
  }

  return groupedOrders.value;
});

// Métricas del Header
const pendingCount = computed(() => {
  return rawPreparations.value.filter((p) => p.status === '0' || p.status === 0).length;
});

const preparingCount = computed(() => {
  return rawPreparations.value.filter((p) => p.status === '1' || p.status === 1).length;
});

const avgPreparationTime = computed(() => {
  if (groupedOrders.value.length === 0) return '0.0';
  const totalMin = groupedOrders.value.reduce((acc, o) => acc + o.elapsedMinutes, 0);
  return (totalMin / groupedOrders.value.length).toFixed(1);
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

// Clases de estilo según tipo de orden
const getOrderTypeLabel = (order) => {
  if (order.order_type === 'P') return 'Autoservicio';
  if (order.order_type === 'M') {
    let area = (order.area || '').trim();
    if (area.toUpperCase() === 'PRINCIPAL') return 'Principal';
    return area || 'Salón';
  }
  if (order.order_type === 'D') return 'Delivery';
  return 'Pedido';
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
  if (checkedItems.value.has(item.id)) {
    checkedItems.value.delete(item.id);
    item.is_done = false;
  } else {
    checkedItems.value.add(item.id);
    item.is_done = true;
    playCheckSound(); // 🔔 Suena al marcar platillo listo
    // Opcional: si se tacha, actualizar status en backend a preparando (1)
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
  try {
    await startOrderPreparations(order.order_id);
    order.status = '1';
    for (const item of order.items) {
      item.status = 1;
    }
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
  try {
    await dispatchOrderPreparations(order.order_id);
    // Remover de la vista optimista
    rawPreparations.value = rawPreparations.value.filter((p) => p.order_id !== order.order_id);
  } catch (err) {
    console.error('Error dispatching order:', err);
  } finally {
    order.isProcessing = false;
    await loadPreparations();
  }
};

const delayedCount = computed(() => {
  return groupedOrders.value.filter((o) => o.elapsedMinutes >= criticalThreshold.value).length;
});

// Controles de cabecera
const toggleSound = () => {
  soundEnabled.value = !soundEnabled.value;
  if (soundEnabled.value) {
    testSound();
  }
};

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
    isFullscreen.value = true;
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
      isFullscreen.value = false;
    }
  }
};

const exitKds = () => {
  router.push({ path: '/' });
};

// Ciclos de vida
onMounted(() => {
  window.addEventListener('click', unlockAudioOnGesture, { once: true });
  window.addEventListener('touchstart', unlockAudioOnGesture, { once: true });
  updateClock();
  clockInterval = setInterval(updateClock, 1000);

  // Actualizar timestamps cada segundo para refrescar los temporizadores
  timerTickInterval = setInterval(() => {
    nowTimestamp.value = Date.now();
  }, 1000);

  // Cargar datos y programar polling
  loadPreparations();
  pollInterval = setInterval(loadPreparations, refreshInterval.value * 1000);
});

onUnmounted(() => {
  window.removeEventListener('click', unlockAudioOnGesture);
  window.removeEventListener('touchstart', unlockAudioOnGesture);
  if (clockInterval) clearInterval(clockInterval);
  if (pollInterval) clearInterval(pollInterval);
  if (timerTickInterval) clearInterval(timerTickInterval);
});
</script>

<style scoped lang="scss">
/* CONTENEDOR GENERAL CON FONDO PERSONALIZADO DE COCINA */
.kds-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background: url('@/assets/images/fondo_kms.jpg') no-repeat center center fixed;
  background-size: cover;
  color: #1e293b;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  overflow: hidden;
  user-select: none;
  position: relative;
}

/* CABECERA TRANSLÚCIDA CON DESENFOQUE ELEGANTE */
.kds-header {
  height: 72px;
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.85);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 4px 14px 0 rgba(0, 0, 0, 0.04);
  flex-shrink: 0;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

.kds-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-icon-wrap {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
  border: 1px solid #bfdbfe;
}

.brand-icon-svg {
  display: inline-flex;
}

.brand-title {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.3px;
  white-space: nowrap;
}

.brand-subtitle {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
  white-space: nowrap;
}

/* FILTROS DINÁMICOS POR ESTACIÓN / ÁREA / TIPO */
.station-filters {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: #f1f5f9;
  padding: 3px 6px;
  border-radius: 8px;
  overflow-x: auto;
  max-width: 520px;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
  flex-shrink: 1;
}

.station-chip {
  border: none;
  background: transparent;
  padding: 5px 11px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  white-space: nowrap;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    color: #0f172a;
  }

  &.active {
    background-color: #ffffff;
    color: #0f172a;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }
}

.station-count {
  background-color: #e2e8f0;
  padding: 1px 5px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
  color: #334155;

  .active & {
    background-color: #3b82f6;
    color: #ffffff;
  }
}

/* MÉTRICAS COMPACTAS */
.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.metrics-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: #f8fafc;
  padding: 4px 10px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  white-space: nowrap;
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #64748b;

  .metric-val {
    font-size: 13px;
    font-weight: 700;
    color: #0f172a;
  }
}

.metric-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;

  .pending & {
    background-color: #f59e0b;
  }
  .preparing & {
    background-color: #3b82f6;
  }
  &.delayed-dot {
    background-color: #ef4444;
    animation: pulse-dot 1.5s infinite;
  }
}

.metric-item.delayed {
  background-color: #fef2f2;
  border-radius: 6px;
  padding: 1px 5px;
  border: 1px solid #fee2e2;

  .delayed-val {
    color: #ef4444 !important;
  }
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.3); }
}

/* RELOJ */
.live-clock {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
  font-variant-numeric: tabular-nums;
  background: #f1f5f9;
  padding: 5px 10px;
  border-radius: 8px;
  white-space: nowrap;
}

.clock-icon-svg {
  color: #3b82f6;
  display: inline-flex;
}

/* ACCIONES DE CABECERA */
.header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.action-btn {
  height: 34px;
  padding: 0 10px;
  background-color: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  color: #334155;
  transition: all 0.2s;
  white-space: nowrap;

  .btn-svg {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  &.icon-only-btn {
    width: 34px;
    padding: 0;
  }

  &:hover {
    background-color: #f1f5f9;
    border-color: #94a3b8;
  }

  &.muted {
    opacity: 0.6;
  }

  &.sound-btn {
    background-color: #f0fdf4;
    border-color: #bbf7d0;
    color: #166534;

    &.muted {
      background-color: #f8fafc;
      border-color: #cbd5e1;
      color: #94a3b8;
    }
  }

  &.test-btn {
    background-color: #eff6ff;
    border-color: #bfdbfe;
    color: #1d4ed8;
  }

  &.exit-btn {
    background-color: #fef2f2;
    border-color: #fecaca;
    color: #b91c1c;

    &:hover {
      background-color: #fee2e2;
      border-color: #fca5a5;
    }
  }
}

/* CUERPO Y GRID DE COMANDAS */
.kds-body {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  overflow-x: hidden;
  background: rgba(248, 250, 252, 0.65);
  backdrop-filter: blur(4px);
}

.orders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  align-items: start;
}

/* TARJETA DE COMANDA */
.order-card {
  background-color: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(10px);
  border-radius: 14px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: 0 4px 16px -2px rgba(0, 0, 0, 0.07);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.12);
  }

  &.is-preparing {
    border-top: 4px solid #3b82f6;
  }

  &.alert-warning {
    border-top: 4px solid #f59e0b;
  }

  &.alert-critical {
    border-top: 4px solid #ef4444;
  }
}

/* ENCABEZADO DE TARJETA */
.card-header {
  padding: 10px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
  gap: 8px;
}

.order-identity {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: nowrap;
}

.order-number {
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
  white-space: nowrap;
}

/* BADGES DE ORIGEN EN TONOS SUAVES */
.order-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  white-space: nowrap;
  line-height: 1.2;
  display: inline-flex;
  align-items: center;
  height: 24px;
}

.badge-takeaway {
  background-color: #f3e8ff;
  color: #7e22ce;
}

.badge-salon {
  background-color: #e0f2fe;
  color: #0369a1;
}

.badge-delivery {
  background-color: #fef3c7;
  color: #b45309;
}

/* BADGES DE ALERTA DEMORA */
.alert-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  white-space: nowrap;
  line-height: 1.2;
  height: 24px;

  &.warning {
    background-color: #fffbeb;
    color: #b45309;
    border: 1px solid #fde68a;
  }

  &.critical {
    background-color: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
    animation: pulse-badge 1.8s infinite ease-in-out;
  }
}

@keyframes pulse-badge {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(220, 38, 38, 0);
  }
}

/* TEMPORIZADOR EN VIVO */
.order-timer {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 6px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  height: 24px;
  flex-shrink: 0;
}

.timer-normal {
  background-color: #ecfdf5;
  color: #047857;
}

.timer-warning {
  background-color: #fffbeb;
  color: #b45309;
}

.timer-critical {
  background-color: #fef2f2;
  color: #b91c1c;
  animation: pulse-border 2s infinite ease-in-out;
}

@keyframes pulse-border {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.75; }
}

/* SUBINFO: SALÓN, MOZO, CLIENTE */
.card-subinfo {
  padding: 6px 16px;
  background-color: #fafafa;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: #64748b;
}

.subinfo-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.subinfo-icon {
  display: inline-flex;
  align-items: center;
}

.subinfo-item strong {
  color: #1e293b;
}

/* LISTA DE PLATILLOS */
.card-items-list {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 380px;
  overflow-y: auto;
}

.item-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  background-color: #f8fafc;
  cursor: pointer;
  transition: background-color 0.15s;

  &:hover {
    background-color: #f1f5f9;
  }

  &.item-done {
    opacity: 0.55;
    background-color: #f1f5f9;

    .item-name {
      text-decoration: line-through;
      color: #94a3b8;
    }
  }
}

.item-check input {
  width: 18px;
  height: 18px;
  margin-top: 2px;
  cursor: pointer;
  accent-color: #10b981;
}

.item-content {
  flex: 1;
}

.item-title-line {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.item-qty {
  font-weight: 800;
  font-size: 14px;
  color: #0f172a;
}

.item-name {
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
}

.station-tag {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  background-color: #e2e8f0;
  color: #475569;
  text-transform: uppercase;
  margin-left: auto;
}

/* INDICACIONES / NOTAS ESPECIALES */
.item-indications {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  padding: 3px 8px;
  border-radius: 4px;
  background-color: #fffbeb;
  border-left: 2px solid #f59e0b;
}

.indication-icon-svg {
  color: #d97706;
  display: inline-flex;
  flex-shrink: 0;
}

.indication-text {
  font-size: 12px;
  font-weight: 600;
  color: #92400e;
}

/* PIE DE TARJETA CON BOTÓN DE ACCIÓN */
.card-footer {
  padding: 12px 16px;
  background-color: #ffffff;
  border-top: 1px solid #f1f5f9;
}

.btn-action {
  width: 100%;
  height: 44px;
  border-radius: 10px;
  border: none;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  .btn-action-icon {
    display: inline-flex;
    margin-right: 6px;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.btn-start {
  background-color: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;

  &:hover:not(:disabled) {
    background-color: #dbeafe;
    border-color: #93c5fd;
  }
}

.btn-dispatch {
  background-color: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;

  &:hover:not(:disabled) {
    background-color: #d1fae5;
    border-color: #6ee7b7;
  }
}

/* ESTADO VACÍO ELEGANTE */
.kds-empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 40px;
}

.empty-card {
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(226, 232, 240, 0.85);
  border-radius: 24px;
  padding: 48px 36px;
  text-align: center;
  max-width: 480px;
  box-shadow: 0 10px 30px -4px rgba(0, 0, 0, 0.1);
}

.empty-icon-wrap {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3b82f6;
  border: 1px solid #bfdbfe;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.empty-icon-svg {
  display: inline-flex;
}

.empty-title {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
}

.empty-desc {
  margin: 0 0 20px;
  font-size: 14px;
  color: #64748b;
  line-height: 1.5;
}

.empty-badge {
  display: inline-block;
  padding: 6px 14px;
  background-color: #f1f5f9;
  border-radius: 20px;
  font-size: 12px;
  color: #475569;
  font-weight: 600;
}
</style>
