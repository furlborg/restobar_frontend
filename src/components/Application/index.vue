<template>
  <!--<n-loading-bar-provider>-->
  <n-dialog-provider>
    <DialogContent />
    <n-notification-provider>
      <n-message-provider>
        <MessageContent />
        <slot name="default"></slot>
      </n-message-provider>
    </n-notification-provider>
  </n-dialog-provider>
  <!--</n-loading-bar-provider>-->
</template>

<script>
import { defineComponent } from "vue";
import MessageContent from "@/components/MessageContent/index.vue";
import DialogContent from "@/components/DialogContent/index.vue";

export default defineComponent({
  name: "Application",
  components: {
    DialogContent,
    MessageContent,
  },
  setup() {
    return {};
  },
});
</script>

<style scoped></style>
