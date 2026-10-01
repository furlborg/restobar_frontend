<template>
  <span class="payment-brand-icon-wrapper" :style="{ width: `${size}px`, height: `${size}px` }">
    <!-- IMAGEN PERSONALIZADA (Si existe en assets/images/payments/) -->
    <img
      v-if="customImage && !imageLoadFailed"
      :src="customImage"
      :alt="method"
      class="payment-custom-img"
      :style="{ width: `${size}px`, height: `${size}px`, objectFit: 'contain' }"
      @error="imageLoadFailed = true"
    />

    <!-- LOGOS VECTORIALES DE ALTA FIDELIDAD DE LAS MARCAS -->
    <template v-else>
      <!-- YAPE OFICIAL -->
      <svg v-if="brand === 'YAPE'" :width="size" :height="size" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="7.5" fill="#742284"/>
        <rect x="0.5" y="0.5" width="31" height="31" rx="7" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
        <path d="M10 8.5C9.45 8.5 9.05 8.95 9.25 9.5L14.3 17.5V23C14.3 23.8 14.95 24.5 15.75 24.5H16.25C17.05 24.5 17.7 23.8 17.7 23V17.5L22.75 9.5C22.95 8.95 22.55 8.5 22 8.5H19.8C19.3 8.5 18.8 8.8 18.5 9.3L16 13.8L13.5 9.3C13.2 8.8 12.7 8.5 12.2 8.5H10Z" fill="white"/>
        <circle cx="23.5" cy="8.5" r="2.4" fill="#00D4B8"/>
      </svg>

      <!-- PLIN OFICIAL -->
      <svg v-else-if="brand === 'PLIN'" :width="size" :height="size" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="7.5" fill="#00B5E2"/>
        <rect x="0.5" y="0.5" width="31" height="31" rx="7" stroke="rgba(255,255,255,0.18)" stroke-width="1"/>
        <g fill="white">
          <path d="M5.5 12.2H7.3V13.6C7.75 12.6 8.8 12 9.9 12C11.7 12 13 13.4 13 15.5C13 17.6 11.7 19 9.9 19C8.8 19 7.75 18.4 7.3 17.4V21.8H5.5V12.2ZM9.2 13.7C8 13.7 7.2 14.5 7.2 15.5C7.2 16.5 8 17.3 9.2 17.3C10.4 17.3 11.2 16.5 11.2 15.5C11.2 14.5 10.4 13.7 9.2 13.7Z"/>
          <path d="M14.2 9.5H16V18.8H14.2V9.5Z"/>
          <path d="M17.4 12.2H19.2V18.8H17.4V12.2Z"/>
          <path d="M20.6 12.2H22.3V13.6C22.7 12.6 23.7 12 24.8 12C26.5 12 27.2 13 27.2 14.8V18.8H25.4V15C25.4 14 24.9 13.6 24 13.6C23 13.6 22.3 14.3 22.3 15.4V18.8H20.6V12.2Z"/>
        </g>
        <circle cx="18.3" cy="9.8" r="1.4" fill="#FFE600"/>
      </svg>

      <!-- TUNKI OFICIAL -->
      <svg v-else-if="brand === 'TUNKI'" :width="size" :height="size" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="7.5" fill="#FF451A"/>
        <rect x="0.5" y="0.5" width="31" height="31" rx="7" stroke="rgba(255,255,255,0.18)" stroke-width="1"/>
        <path d="M10 8.5C10 8.5 13.2 7.2 17.5 7.8C21.2 8.3 23.8 11.2 23.8 14.5C23.8 17.2 22.2 19.4 20 20.4L20.6 24.5L16.8 22.2C16.4 22.2 16.1 22.3 15.8 22.3C11.8 22.3 8.8 19 8.8 14.8C8.8 12.2 9.8 9.9 10 8.5Z" fill="white"/>
        <circle cx="14.2" cy="13.8" r="1.6" fill="#FF451A"/>
        <circle cx="14.2" cy="13.8" r="0.8" fill="#FFD200"/>
      </svg>

      <!-- EFECTIVO / SOLES REALISTA -->
      <svg v-else-if="brand === 'EFECTIVO'" :width="size" :height="size" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3.5" y="6" width="24" height="15" rx="3" fill="#047857" opacity="0.6"/>
        <rect x="2" y="9" width="25" height="16" rx="3" fill="#10B981"/>
        <rect x="3.5" y="10.5" width="22" height="13" rx="2" stroke="#A7F3D0" stroke-width="0.8" stroke-dasharray="2 1"/>
        <circle cx="14.5" cy="17" r="4.5" fill="#059669" stroke="#ECFDF5" stroke-width="0.8"/>
        <text x="14.5" y="19.4" font-size="6.5" font-weight="900" fill="#FFFFFF" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">S/</text>
        <circle cx="25" cy="19.5" r="4.5" fill="#F59E0B" stroke="#FDE68A" stroke-width="0.8"/>
        <circle cx="25" cy="19.5" r="3.2" fill="#D97706"/>
        <text x="25" y="21.3" font-size="5" font-weight="900" fill="#FEF3C7" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">★</text>
      </svg>

      <!-- TARJETA (VISA & MASTERCARD DUAL BADGE) -->
      <svg v-else-if="brand === 'TARJETA'" :width="size" :height="size" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="5.5" width="28" height="21" rx="4" fill="#0F172A"/>
        <path d="M2 9.5C2 7.3 3.8 5.5 6 5.5H26C28.2 5.5 30 7.3 30 9.5V12H2V9.5Z" fill="#1E293B"/>
        <rect x="5.5" y="14" width="5.5" height="4.5" rx="1.2" fill="#F59E0B"/>
        <path d="M7 14V18.5M9.5 14V18.5M5.5 16.2H11" stroke="#D97706" stroke-width="0.5"/>
        <circle cx="21" cy="18.5" r="3.4" fill="#EB001B"/>
        <circle cx="25" cy="18.5" r="3.4" fill="#F79E1B"/>
        <path d="M23 15.7C23.8 16.4 24.3 17.4 24.3 18.5C24.3 19.6 23.8 20.6 23 21.3C22.2 20.6 21.7 19.6 21.7 18.5C21.7 17.4 22.2 16.4 23 15.7Z" fill="#FF5F00"/>
      </svg>

      <!-- DEPOSITO / TRANSFERENCIA BANCARIA -->
      <svg v-else-if="brand === 'BANCO'" :width="size" :height="size" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="7.5" fill="#1E293B"/>
        <path d="M16 6.5L6.5 11.5H25.5L16 6.5Z" fill="#38BDF8"/>
        <rect x="7.5" y="12" width="17" height="1.8" rx="0.5" fill="#BAE6FD"/>
        <rect x="8.5" y="14.5" width="2.4" height="7" rx="0.5" fill="white"/>
        <rect x="12.5" y="14.5" width="2.4" height="7" rx="0.5" fill="white"/>
        <rect x="17.1" y="14.5" width="2.4" height="7" rx="0.5" fill="white"/>
        <rect x="21.1" y="14.5" width="2.4" height="7" rx="0.5" fill="white"/>
        <rect x="6.5" y="22" width="19" height="1.8" rx="0.5" fill="#BAE6FD"/>
        <rect x="5.5" y="24" width="21" height="2" rx="0.6" fill="#38BDF8"/>
      </svg>

      <!-- OTROS / DEFAULT (POS TERMINAL) -->
      <svg v-else :width="size" :height="size" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="7.5" fill="#334155"/>
        <rect x="8" y="7" width="16" height="18" rx="2" fill="#1E293B" stroke="#94A3B8" stroke-width="1"/>
        <rect x="10" y="9" width="12" height="6" rx="1" fill="#38BDF8"/>
        <circle cx="12" cy="18" r="1" fill="#E2E8F0"/>
        <circle cx="16" cy="18" r="1" fill="#E2E8F0"/>
        <circle cx="20" cy="18" r="1" fill="#E2E8F0"/>
        <circle cx="12" cy="21" r="1" fill="#E2E8F0"/>
        <circle cx="16" cy="21" r="1" fill="#10B981"/>
        <circle cx="20" cy="21" r="1" fill="#EF4444"/>
      </svg>
    </template>
  </span>
</template>

<script setup>
import { computed, ref, watch } from "vue";

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

// Importación dinámica de imágenes colocadas por el usuario en src/assets/images/payments/
const customLogos = import.meta.glob(
  "@/assets/images/payments/*.{png,jpg,jpeg,svg,webp}",
  { eager: true, import: "default" }
);

const imageLoadFailed = ref(false);

watch(() => props.method, () => {
  imageLoadFailed.value = false;
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

const customImage = computed(() => {
  const m = String(props.method || "").toUpperCase();
  const b = brand.value;
  for (const [path, url] of Object.entries(customLogos)) {
    const filename = path.split("/").pop().toLowerCase();
    const baseName = filename.substring(0, filename.lastIndexOf("."));
    if (b === "YAPE" && baseName.includes("yape")) return url;
    if (b === "PLIN" && baseName.includes("plin")) return url;
    if (b === "TUNKI" && baseName.includes("tunki")) return url;
    if (b === "EFECTIVO" && (baseName.includes("efectivo") || baseName.includes("cash"))) return url;
    if (b === "TARJETA" && (baseName.includes("tarjeta") || baseName.includes("card") || baseName.includes("visa") || baseName.includes("mastercard"))) return url;
    if (b === "BANCO" && (baseName.includes("banco") || baseName.includes("deposit") || baseName.includes("transfer"))) return url;
    if (m.toLowerCase().includes(baseName) || baseName.includes(m.toLowerCase())) return url;
  }
  return null;
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
.payment-custom-img {
  display: block;
  object-fit: contain;
  border-radius: 4px;
}
</style>
