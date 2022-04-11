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
            <n-input
              v-model:value="formInline.username"
              placeholder="Usuario"
              :disabled="loading"
              @input="formInline.username = $event.toUpperCase()"
              @keypress.enter="handleSubmit"
            >
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
              :disabled="loading"
              @keypress.enter="handleSubmit"
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
import { defineComponent, ref, reactive } from "vue";
import { useMessage } from "naive-ui";
import { useRouter } from "vue-router";
import { login } from "@/api/modules/users";
import { useUserStore } from "@/store/modules/user";
import { useGenericsStore } from "@/store/modules/generics";

export default defineComponent({
  name: "login",
  setup() {
    const userStore = useUserStore();
    const genericsStore = useGenericsStore();
    const formRef = ref();
    const message = useMessage();
    const loading = ref(false);

    const router = useRouter();

    userStore.initializeStore();

    const formInline = reactive({
      username: "ADMIN",
      password: "admin",
    });

    const rules = {
      username: {
        required: true,
        message: "Nombre de usuario requerido",
        trigger: ["blur", "input"],
      },
      password: {
        required: true,
        message: "Contraseña requerido",
        trigger: ["blur", "input"],
      },
    };

    const handleSubmit = () => {
      formRef.value.validate(async (errors) => {
        if (!errors) {
          const { username, password } = formInline;
          loading.value = true;
          await login(username, password)
            .then((response) => {
              userStore.login(response.data);
              message.success("¡Inicio de sesión correcto!");
              loading.value = false;
              router.push({
                name:
                  userStore.user.profile_des === "MOZO"
                    ? genericsStore.device === "desktop"
                      ? "TableHome"
                      : "WaiterMode"
                    : "Dashboard",
              });
            })
            .catch((error) => {
              console.error(error);
              loading.value = false;
              message.error("Error de inicio de sesión");
            });
        } else {
          message.error("Complete la información requerida.");
        }
      });
    };

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