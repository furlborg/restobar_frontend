<template>
  <n-dialog-provider>
    <DialogContent />
    <n-notification-provider>
      <n-message-provider>
        <MessageContent />
        <slot name="default"></slot>
      </n-message-provider>
    </n-notification-provider>
  </n-dialog-provider>
</template>

<script setup>
import MessageContent from "@/components/MessageContent";
import DialogContent from "@/components/DialogContent";


</script>
