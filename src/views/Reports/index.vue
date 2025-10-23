<template>
    <template v-if="isHome">
        <div class="page">
            <h1 class="title">Reportes</h1>
            <div class="tiles">
                <div class="tile" @click="go('ProductsSoldReport')">
                    <div class="ico"><span>🛒</span></div>
                    <div class="name">Productos vendidos</div>
                </div>
                <div class="tile" @click="go('CashFlowReport')">
                    <div class="ico"><span>💵</span></div>
                    <div class="name">Caja</div>
                </div>
                <div class="tile" @click="go('SalesByDateReport')">
                    <div class="ico"><span>📅</span></div>
                    <div class="name">Ventas por Fechas</div>
                </div>
                <div class="tile" @click="go('SalesDetailedReport')">
                    <div class="ico"><span>📋</span></div>
                    <div class="name">Ventas Detalladas</div>
                </div>
                <div class="tile" @click="go('SalesRecordReport')">
                    <div class="ico"><span>🏆</span></div>
                    <div class="name">Récord de Ventas</div>
                </div>
            </div>
        </div>
    </template>
    <router-view v-else />
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'

const router = useRouter()
const route = useRoute()

// Mostrar mosaicos solo en /reports
const isHome = computed(() => route.name === 'Reports')

function go(name) { router.push({ name }) }
</script>

<style scoped>
.page { max-width: 700px; margin: 0 auto; padding: 32px 16px 0 16px; }
.title { font-size: 2rem; font-weight: 700; margin-bottom: 2rem; text-align: center; }
.tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2rem; }
.tile {
    background: #fff; border-radius: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,.07);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 2.5rem 1rem 1.5rem; cursor: pointer; transition: box-shadow .2s, transform .2s;
    min-height: 150px;
}
.tile:hover { box-shadow: 0 4px 16px rgba(0,0,0,.13); transform: translateY(-2px) scale(1.03); }
.ico { font-size: 2.5rem; margin-bottom: 1rem; }
.name { font-size: 1.1rem; font-weight: 500; text-align: center; }
@media (max-width: 600px) {
    .page { padding-top: 16px; }
    .tiles { gap: 1rem; }
    .tile { padding: 2rem .5rem 1rem; min-height: 110px; }
    .ico { font-size: 2rem; }
}
</style>