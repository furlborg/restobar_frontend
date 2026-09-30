<template>
  <span class="payment-brand-icon-wrapper" :style="{ width: `${size}px`, height: `${size}px` }">
    <!-- YAPE -->
    <svg v-if="brand === 'YAPE'" :width="size" :height="size" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="7" fill="#742284"/>
      <path d="M9.5 9L15 17.5V24H17V17.5L22.5 9H20L16 15.3L12 9H9.5Z" fill="white"/>
      <circle cx="21.5" cy="11.5" r="2.2" fill="#00D4B8"/>
    </svg>

    <!-- PLIN -->
    <svg v-else-if="brand === 'PLIN'" :width="size" :height="size" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="7" fill="#00B4D8"/>
      <path d="M10 23V9H15.5C18 9 19.8 10.8 19.8 13.3C19.8 15.8 18 17.6 15.5 17.6H12.5V23H10ZM12.5 15.2H15.3C16.4 15.2 17.3 14.3 17.3 13.3C17.3 12.3 16.4 11.4 15.3 11.4H12.5V15.2Z" fill="white"/>
      <circle cx="22" cy="21" r="2.5" fill="#FFE600"/>
    </svg>

    <!-- TUNKI -->
    <svg v-else-if="brand === 'TUNKI'" :width="size" :height="size" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="7" fill="#FF4B2B"/>
      <path d="M8 10.5H24V13.5H17.5V23.5H14.5V13.5H8V10.5Z" fill="white"/>
      <circle cx="21" cy="18" r="2" fill="#FFD200"/>
    </svg>

    <!-- EFECTIVO (CASH) -->
    <svg v-else-if="brand === 'EFECTIVO'" :width="size" :height="size" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="7" width="28" height="18" rx="4" fill="#059669"/>
      <rect x="4" y="9" width="24" height="14" rx="2" stroke="#A7F3D0" stroke-width="1.2" stroke-dasharray="2 1"/>
      <circle cx="16" cy="16" r="4.5" fill="#10B981" stroke="#ECFDF5" stroke-width="1"/>
      <text x="16" y="19" font-size="7.5" font-weight="900" fill="white" text-anchor="middle" font-family="sans-serif">S/</text>
    </svg>

    <!-- TARJETA (VISA / MASTERCARD / CARD) -->
    <svg v-else-if="brand === 'TARJETA'" :width="size" :height="size" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="6" width="28" height="20" rx="4" fill="#1E3A8A"/>
      <rect x="2" y="10" width="28" height="4" fill="#0F172A"/>
      <rect x="5" y="17" width="6" height="4.5" rx="1" fill="#F59E0B"/>
      <circle cx="21" cy="19.5" r="3" fill="#EF4444" fill-opacity="0.85"/>
      <circle cx="24.5" cy="19.5" r="3" fill="#F59E0B" fill-opacity="0.85"/>
    </svg>

    <!-- DEPOSITO / TRANSFERENCIA BANCARIA -->
    <svg v-else-if="brand === 'BANCO'" :width="size" :height="size" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="7" fill="#0F172A"/>
      <path d="M16 6L6 11V13H26V11L16 6Z" fill="#38BDF8"/>
      <rect x="8" y="14" width="2.5" height="8" fill="white"/>
      <rect x="12.5" y="14" width="2.5" height="8" fill="white"/>
      <rect x="17" y="14" width="2.5" height="8" fill="white"/>
      <rect x="21.5" y="14" width="2.5" height="8" fill="white"/>
      <rect x="6" y="23" width="20" height="2.5" rx="0.5" fill="#38BDF8"/>
    </svg>

    <!-- OTROS / DEFAULT (POS TERMINAL) -->
    <svg v-else :width="size" :height="size" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="7" fill="#334155"/>
      <rect x="8" y="7" width="16" height="18" rx="2" fill="#1E293B" stroke="#94A3B8" stroke-width="1"/>
      <rect x="10" y="9" width="12" height="6" rx="1" fill="#38BDF8"/>
      <circle cx="12" cy="18" r="1" fill="#E2E8F0"/>
      <circle cx="16" cy="18" r="1" fill="#E2E8F0"/>
      <circle cx="20" cy="18" r="1" fill="#E2E8F0"/>
      <circle cx="12" cy="21" r="1" fill="#E2E8F0"/>
      <circle cx="16" cy="21" r="1" fill="#10B981"/>
      <circle cx="20" cy="21" r="1" fill="#EF4444"/>
    </svg>
  </span>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  method: {
    type: String,
    default: "",
  },
  size: {
    type: [Number, String],
    default: 24,
  },
});

const brand = computed(() => {
  const m = String(props.method || "").toUpperCase();
  if (m.includes("YAPE")) return "YAPE";
  if (m.includes("PLIN")) return "PLIN";
  if (m.includes("TUNKI")) return "TUNKI";
  if (m.includes("EFECTIVO") || m.includes("CASH")) return "EFECTIVO";
  if (m.includes("TARJETA") || m.includes("POS") || m.includes("VISA") || m.includes("MASTERCARD") || m.includes("CARD")) return "TARJETA";
  if (m.includes("DEPOSIT") || m.includes("BANCO") || m.includes("BANCAR") || m.includes("TRANSFER")) return "BANCO";
  return "OTHER";
});
</script>

<style scoped>
.payment-brand-icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.payment-brand-icon-wrapper svg {
  display: block;
}
</style>
