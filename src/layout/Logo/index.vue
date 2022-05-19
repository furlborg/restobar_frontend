<template>
  <div class="logo">
    <img
      draggable="false"
      src="~@/assets/images/account-logo.png"
      alt=""
      :class="{ 'img-2': collapsed }"
    />
  </div>
</template>

<script>
import { defineComponent } from "vue";

export default defineComponent({
  name: "Logo",
  props: {
    collapsed: {
      type: Boolean,
    },
  },
});
</script>

<style lang="scss" scoped>
.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 96px;
  line-height: 64px;
  overflow: hidden;
  white-space: nowrap;

  img {
    width: auto;
    height: 64px;
  }

  .img-2 {
    height: 32px;
  }

  .title {
    margin-bottom: 0;
  }
}
</style>