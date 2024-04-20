<script>
import { defineComponent, onMounted, ref } from "vue";
import { getCustomers, getCustomersByPageNumber } from "@/api/modules/customer";
import { useMessage } from "naive-ui";

export default defineComponent({
	// eslint-disable-next-line vue/multi-word-component-names
	name: "Cums",
	setup() {
		const isTableLoading = ref(false);
		const customers = ref([]);
		const message = useMessage();

		function daysUntilNextBirthday(birthday) {
			const today = new Date();
			const currentYear = today.getFullYear();
			const nextBirthday = new Date(birthday);
			nextBirthday.setFullYear(currentYear);
			if(today > nextBirthday) {
				nextBirthday.setFullYear(currentYear + 1);
			}
			const oneDay = 24 * 60 * 60 * 1000;
			return Math.round((nextBirthday - today) / oneDay);
		}

		const pagination = ref({
			pageSearchParams: null,
			previusPage: null,
			total: 0,
			offset: 0,
			page: 1,
			pageSlot: 6,
			pageCount: 1,
			pageSize: 10,
			showSizePicker: true,
			pageSizes: [10, 25, 50, 100],
			onChange: async(page) => {
				isTableLoading.value = true;
				pagination.value.page = page;
				pagination.value.offset = --page * pagination.value.pageSize;
				await getCustomersByPageNumber(
					pagination.value.pageSearchParams,
					pagination.value.pageSize,
					pagination.value.offset
				).then((response) => {
					pagination.value.total = response.data.count;
					pagination.value.pageCount = Math.trunc(
						Number(response.data.count) / pagination.value.pageSize
					);
					if(
						Number(response.data.count) % pagination.value.pageSize !== 0 ||
						pagination.value.pageCount === 0
					) {
						++pagination.value.pageCount;
					}
					customers.value = response.data.results.sort((a, b) => {
						const daysUntilBirthdayA = daysUntilNextBirthday(a?.["birthday"]);
						const daysUntilBirthdayB = daysUntilNextBirthday(b?.["birthday"]);
						return daysUntilBirthdayA - daysUntilBirthdayB;
					});
				}).catch((error) => {
					console.error(error);
					message.error("Algo salió mal...");
				}).finally(() => {
					isTableLoading.value = false;
				});
			},
			onPageSizeChange: async(pageSize) => {
				isTableLoading.value = true;
				pagination.value.offset = 0;
				pagination.value.page = 1;
				pagination.value.pageSize = pageSize;
				await getCustomersByPageNumber(
					pagination.value.pageSearchParams,
					pageSize,
					pagination.value.offset
				).then((response) => {
					pagination.value.total = response.data.count;
					pagination.value.pageCount = Math.trunc(
						Number(response.data.count) / pagination.value.pageSize
					);
					if(
						Number(response.data.count) % pagination.value.pageSize !== 0 ||
						pagination.value.pageCount === 0
					) {
						++pagination.value.pageCount;
					}
					customers.value = response.data.results.sort((a, b) => {
						const daysUntilBirthdayA = daysUntilNextBirthday(a?.["birthday"]);
						const daysUntilBirthdayB = daysUntilNextBirthday(b?.["birthday"]);
						return daysUntilBirthdayA - daysUntilBirthdayB;
					});
				}).catch((error) => {
					console.error(error);
					message.error("Algo salió mal...");
				}).finally(() => {
					isTableLoading.value = false;
				});
			}
		});

		const loadCustomersData = async() => {
			isTableLoading.value = true;
			pagination.value.offset = 0;
			pagination.value.page = 1;
			await getCustomers().then((response) => {
				pagination.value.total = response.data.count;
				pagination.value.pageCount = Math.trunc(
					Number(response.data.count) / pagination.value.pageSize
				);
				if(
					Number(response.data.count) % pagination.value.pageSize !== 0 ||
					pagination.value.pageCount === 0
				) {
					++pagination.value.pageCount;
				}
				customers.value = response.data.results.sort((a, b) => {
					const daysUntilBirthdayA = daysUntilNextBirthday(a?.["birthday"]);
					const daysUntilBirthdayB = daysUntilNextBirthday(b?.["birthday"]);
					return daysUntilBirthdayA - daysUntilBirthdayB;
				});
			}).catch((error) => {
				console.error(error);
				message.error("Algo salió mal...");
			}).finally(() => {
				isTableLoading.value = false;
			});
		};

		onMounted(async() => {
			await loadCustomersData();
		});

		const columns = [
			{
				title: "Documento",
				key: "doc_num",
				align: "center",
				width: 150
			},
			{
				title: "Nombre",
				key: "names",
				align: "center",
				width: 300
			},
			{
				title: "Dirección",
				key: "addresses",
				align: "center",
				width: 200,
				render(row) {
					if(row.addresses.length > 0) {
						return !row.addresses[0].description
							? "-----"
							: row.addresses[0].description;
					}
					return "-----";
				}
			},
			{
				title: "Género",
				key: "gender",
				align: "center",
				width: 100
			},
			{
				title: "F. Nacimiento",
				key: "birthdate",
				align: "center",
				width: 125
			},
			{
				title: "Celular",
				key: "phone",
				align: "center",
				width: 150
			},
			{
				title: "Correo",
				key: "email",
				align: "center",
				width: 200
			}
		];

		return { columns, loadCustomersData, isTableLoading, customers, pagination };
	}
});
</script>

<template>
    <div>
        <n-card title="Cumpleaños de Clientes" :bordered="false" segmented="segmented">

            <n-data-table :columns="columns" :data="customers" :pagination="pagination" :loading="isTableLoading" scroll-x="1250">

            </n-data-table>
        </n-card>
    </div>
</template>