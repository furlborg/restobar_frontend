<template>
  <n-layout position="absolute">
    <n-layout-header style="height: 48px" position="absolute" bordered>
      <n-space justify="space-between">
        <n-text class="fs-6">MOZO 01</n-text>
        <div
          class="menuBtn"
          :class="{ act: active === true }"
          @click="active ? (active = false) : (active = true)"
        >
          <span class="lines"></span>
        </div>
      </n-space>
    </n-layout-header>
    <n-layout-content
      position="absolute"
      style="top: 48px"
      :native-scrollbar="false"
    >
      <router-view v-slot="{ Component }">
        <transition name="zoom-fade" mode="out-in" appear>
          <component :is="Component" />
        </transition>
      </router-view>
    </n-layout-content>
    <div class="mainMenu" :class="{ act: active === true }">
      <ul>
        <li>
          <a href="#">Intro</a>
        </li>
        <li>
          <a href="#">Services</a>
        </li>
        <li>
          <a href="#">Team</a>
        </li>
        <li>
          <a href="#">Pricing</a>
        </li>
        <li>
          <a href="#" class="suBtn">Sing Up</a>
        </li>
      </ul>
    </div>
  </n-layout>
</template>

<script>
import { defineComponent, ref } from "vue";
import { useTableStore } from "@/store/modules/table";

export default defineComponent({
  name: "WaiterMode",
  setup() {
    const active = ref(false);

    const tableStore = useTableStore();
    tableStore.initializeStore();

    return {
      active,
    };
  },
});
</script>

<style lang="scss" scoped>
* {
  margin: 0;
  padding: 0;
}
*,
*:after,
*:before {
  box-sizing: border-box;
}
ol,
ul {
  list-style: none;
}
a {
  color: #000;
  text-decoration: none;
}

header {
  background-color: #fff;
  background-color: rgba(255, 255, 255, 0);
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
  height: 50px;
}
.logo {
  color: #000;
  font-size: 20px;
  line-height: 50px;
  padding: 0 0 0 20px;
  text-transform: capitalize;
}
/* menu button */
.menuBtn {
  height: 30px;
  width: 30px;

  position: absolute;
  right: 20px;
  top: 10px;
  z-index: 101;
  > span {
    background-color: #000;
    border-radius: 1px;
    height: 2px;
    width: 100%;
    position: absolute;
    left: 50%;
    top: 50%;
    margin: -1px 0 0 -15px;
    transition: height 100ms;
    &:after,
    &:before {
      content: "";
      background-color: #000;
      border-radius: 1px;
      height: 2px;
      width: 100%;
      position: absolute;
      left: 50%;
      margin-left: -15px;
      transition: all 200ms;
    }
    &:after {
      top: -7px;
    }
    &:before {
      bottom: -7px;
    }
  }
  &.act {
    > span {
      height: 0;
      &:after,
      &:before {
        background-color: #008877;
        top: 1px;
      }
      &:after {
        transform: rotate(45deg);
      }
      &:before {
        transform: rotate(-45deg);
      }
    }
  }
}
/* main menu block */
.mainMenu {
  background-color: #fff;
  position: absolute;
  left: 0;
  top: 0;
  z-index: 100;
  height: 100%;
  width: 100%;
  display: table;
  text-align: center;
  opacity: 0;
  transition: all 500ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
  transform: scale(0);
  &.act {
    opacity: 1;
    transform: scale(1);
    ul li {
      opacity: 1;
      transform: translateX(0);
    }
  }
  ul {
    display: table-cell;
    vertical-align: middle;
  }
  li {
    padding: 8px 0;
    transition: all 400ms 510ms;
    opacity: 0;
    &:nth-child(odd) {
      transform: translateX(30%);
    }
    &:nth-child(even) {
      transform: translateX(-30%);
    }
    &:last-child {
      transform: none;
    }
  }
  a {
    color: #19b698;
    display: inline-block;
    font-size: 18px;
    &.suBtn {
      color: #fff;
    }
  }
}
/* sign up button */
.suBtn {
  background-color: #19b698;
  border-radius: 5px;
  padding: 10px 20px;
}

/* router view transition */
.zoom-fade-enter-active,
.zoom-fade-leave-active {
  transition: transform 0.35s, opacity 0.28s ease-in-out;
}

.zoom-fade-enter-from {
  opacity: 0;
  transform: scale(0.97);
}

.zoom-fade-leave-to {
  opacity: 0;
  transform: scale(1.03);
}
</style>