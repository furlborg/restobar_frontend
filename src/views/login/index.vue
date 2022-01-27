<template>
  <div class="view-account">
    <div class="view-account-container">
      <div class="view-account-top">
        <div class="view-account-top-logo">
          <img
            draggable="false"
            src="~@/assets/images/account-logo.png"
            alt=""
          />
        </div>
      </div>
      <div class="view-account-form">
        <n-form
          ref="formRef"
          label-placement="left"
          size="large"
          :model="formInline"
          :rules="rules"
        >
          <n-form-item path="username">
            <n-input v-model:value="formInline.username" placeholder="Usuario">
              <template #prefix>
                <v-icon name="md-personoutline-twotone" fill="#808695" />
              </template>
            </n-input>
          </n-form-item>
          <n-form-item path="password">
            <n-input
              v-model:value="formInline.password"
              type="password"
              showPasswordOn="click"
              placeholder="Contraseña"
            >
              <template #prefix>
                <v-icon name="md-lockopen-twotone" fill="#808695" />
              </template>
            </n-input>
          </n-form-item>
          <n-form-item>
            <n-button
              @click.prevent="handleSubmit"
              size="large"
              :loading="loading"
              color="#A32B2C"
              block
            >
              Iniciar Sesión
            </n-button>
          </n-form-item>
        </n-form>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref } from "vue-demi";

export default defineComponent({
  name: "login",
  setup() {
    const formRef = ref();

    const loading = ref(false);

    const formInline = ref({
      username: "",
      password: "",
    });

    const rules = {
      username: {
        required: true,
        message: "Por favor ingrese el nombre de usuario",
        trigger: ["blur", "input"],
      },
      password: {
        required: true,
        message: "Por favor, ingrese contraseña",
        trigger: ["blur", "input"],
      },
    };

    const handleSubmit = () => {};

    return {
      formRef,
      loading,
      rules,
      formInline,
      handleSubmit,
    };
  },
});
</script>

<style lang="scss">
.view-account {
  height: 100vh;
  overflow: auto;
  display: flex;

  &-container {
    display: block;
    background-color: white;
    border: 1px solid whitesmoke;
    border-radius: 1rem;
    padding: 32px;
    width: 384px;
    margin: auto;
    box-shadow: rgba(99, 99, 99, 0.2) 0px 2px 8px 0px;
  }
  &-top {
    text-align: center;
    margin-bottom: 50px;
    &-desc {
      font-size: 14px;
      color: #808695;
    }
  }
  &-other {
    width: 100%;
  }
  .default-color {
    color: #515a6e;
    .ant-checkbox-wrapper {
      color: #515a6e;
    }
  }
}
@media (min-width: 768px) {
  .view-account {
    background-image: url("../../assets/images/food_pattern_gray.png");
    background-repeat: repeat;
    background-position: 50%;
    background-size: 30%;
  }
  .page-account-container {
    padding: 32px 0 24px 0;
  }
}
</style>