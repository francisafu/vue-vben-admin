<script lang="ts" setup>
import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { useVbenForm, z } from '#/adapter/form';
import { $t } from '#/locales';
import {
  addAddressApi,
  updateAddressApi,
  getAddressDataApi
} from '#/api/core/account';
import { message } from 'ant-design-vue';
import type { AccountApi } from '#/api/core/account';

// 表单数据
const data = ref<Record<string, any>>({});
const isEdit = computed(() => !!data.value?.addressData);
const addressData = ref<AccountApi.AddressData | null>(null);
const loading = ref(false);
const submitting = ref(false);

// 地址选择状态
const selectedProvince = ref<string>('');
const selectedCity = ref<string>('');
const selectedDistrict = ref<string>('');

// 初始化modal
const [Modal, modalApi] = useVbenModal({
  title: $t('page.account.addressManagement'),
  draggable: true,
  footer: false,
  // 打开modal时获取数据
  async onOpenChange(isOpen: boolean) {
    if (isOpen) {
      // 获取传入的数据
      data.value = modalApi.getData<Record<string, any>>() || {};

      // 获取地址数据
      await fetchAddressData();

      // 根据模式选择不同的初始化方式
      if (isEdit.value) {
        // 编辑模式：直接填充表单数据，不重置
        const addressInfo = data.value.addressData;

        // 清空选项，避免历史数据残留
        addressFormApi.updateSchema([
          {
            componentProps: {
              options: [],
            },
            fieldName: 'city',
          },
          {
            componentProps: {
              options: [],
            },
            fieldName: 'district',
          }
        ]);

        // 先设置省份，然后是城市区县的顺序
        selectedProvince.value = addressInfo.provinceName;
        updateCityOptions();

        // 然后设置城市
        selectedCity.value = addressInfo.cityName;
        updateDistrictOptions();

        // 最后设置区县
        selectedDistrict.value = addressInfo.districtName;

        // 设置表单值
        const formValues = {
          userName: addressInfo.userName,
          mobilePhone: addressInfo.mobilePhone,
          province: addressInfo.provinceName,
          city: addressInfo.cityName,
          district: addressInfo.districtName,
          addrDetail: addressInfo.addrDetail
        };
        addressFormApi.setValues(formValues);
      } else {
        // 新建模式：重置所有状态
        resetAllState();
      }
    } else {
      // 关闭modal时重置状态
      resetAllState();
    }
  },
});

// 重置所有状态
function resetAllState() {
  // 重置状态变量
  selectedProvince.value = '';
  selectedCity.value = '';
  selectedDistrict.value = '';

  // 重置表单数据 - 使用any类型绕过类型检查
  (addressFormApi as any).resetFields && (addressFormApi as any).resetFields();

  // 重置表单值为空
  addressFormApi.setValues({
    userName: '',
    mobilePhone: '',
    province: undefined,
    city: undefined,
    district: undefined,
    addrDetail: ''
  });

  // 清空表单中的下拉选项数据
  addressFormApi.updateSchema([
    {
      componentProps: {
        options: [],
      },
      fieldName: 'city',
    },
    {
      componentProps: {
        options: [],
      },
      fieldName: 'district',
    }
  ]);
}

// 获取地址数据
async function fetchAddressData() {
  try {
    loading.value = true;
    const res = await getAddressDataApi();
    addressData.value = res;

    // 更新省份下拉选项
    updateProvinceOptions();
  } catch (error) {
    message.error($t('page.account.fetchAddressDataError'));
  } finally {
    loading.value = false;
  }
}

// 更新省份下拉选项
function updateProvinceOptions() {
  const options = addressData.value?.address?.map(item => ({
    label: item.name,
    value: item.name,
  })) || [];

  addressFormApi.updateSchema([
    {
      componentProps: {
        options,
      },
      fieldName: 'province',
    },
  ]);
}

// 更新城市下拉选项
function updateCityOptions() {
  if (!addressData.value?.address || !selectedProvince.value) {
    return;
  }

  const provinceData = addressData.value.address.find(
    (item) => item.name === selectedProvince.value
  );

  if (!provinceData) {
    return;
  }

  const options = provinceData?.children?.map(item => ({
    label: item.name,
    value: item.name,
  })) || [];


  addressFormApi.updateSchema([
    {
      componentProps: {
        options,
      },
      fieldName: 'city',
    },
  ]);
}

// 更新区县下拉选项
function updateDistrictOptions() {
  if (!addressData.value?.address || !selectedProvince.value || !selectedCity.value) {
    return;
  }

  const provinceData = addressData.value.address.find(
    (item) => item.name === selectedProvince.value
  );

  if (!provinceData) {
    return;
  }

  const cityData = provinceData?.children?.find(
    (item) => item.name === selectedCity.value
  );

  if (!cityData) {
    return;
  }

  const options = cityData?.children?.map(item => ({
    label: item.name,
    value: item.name,
  })) || [];


  addressFormApi.updateSchema([
    {
      componentProps: {
        options,
      },
      fieldName: 'district',
    },
  ]);
}

// 处理省份变化
function handleProvinceChange(value: string) {
  selectedProvince.value = value;
  selectedCity.value = '';
  selectedDistrict.value = '';

  // 更新城市下拉选项
  updateCityOptions();

  addressFormApi.setValues({
    city: undefined,
    district: undefined,
  });
}

// 处理城市变化
function handleCityChange(value: string) {
  selectedCity.value = value;
  selectedDistrict.value = '';

  // 更新区县下拉选项
  updateDistrictOptions();

  addressFormApi.setValues({
    district: undefined,
  });
}

// 处理区县变化
function handleDistrictChange(value: string) {
  selectedDistrict.value = value;
}

// 处理表单提交
async function handleSubmit(values: any) {
  try {
    submitting.value = true;

    const params = {
      userName: values.userName,
      mobilePhone: values.mobilePhone,
      provinceName: values.province,
      cityName: values.city,
      districtName: values.district,
      addrDetail: values.addrDetail,
    };

    if (isEdit.value) {
      // 编辑地址
      await updateAddressApi({
        ...params,
        id: data.value.addressData.id,
      });
      message.success($t('page.account.updateAddressSuccess'));
    } else {
      // 新增地址
      await addAddressApi(params);
      message.success($t('page.account.addAddressSuccess'));
    }

    // 设置状态标记操作成功
    data.value.operationSuccess = true;

    // 关闭弹窗
    modalApi.close();

  } catch (error) {
    message.error(isEdit.value
      ? $t('page.account.updateAddressError')
      : $t('page.account.addAddressError')
    );
  } finally {
    submitting.value = false;
  }
}

// 表单配置
const [AddressForm, addressFormApi] = useVbenForm({
  layout: 'vertical',
  handleSubmit,
  submitButtonOptions: {
    content: $t('page.common.save'),
    disabled: false,
    loading: false,
  },
  resetButtonOptions: {
    content: $t('page.common.clear'),
  },
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: $t('page.account.recipientPlaceholder'),
      },
      fieldName: 'userName',
      label: $t('page.account.recipient'),
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: $t('page.account.phonePlaceholder'),
        maxlength: 11,
      },
      fieldName: 'mobilePhone',
      label: $t('page.account.phone'),
      rules: z.string().regex(/^1[3-9]\d{9}$/, $t('page.account.phoneFormatError')),
    },
    {
      component: 'Select',
      componentProps: {
        placeholder: $t('page.account.provincePlaceholder'),
        options: [],
        onChange: handleProvinceChange,
        style: { width: '100%' },
      },
      fieldName: 'province',
      label: $t('page.account.province'),
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: {
        placeholder: $t('page.account.cityPlaceholder'),
        options: [],
        onChange: handleCityChange,
        style: { width: '100%' },
      },
      fieldName: 'city',
      label: $t('page.account.city'),
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: {
        placeholder: $t('page.account.districtPlaceholder'),
        options: [],
        onChange: handleDistrictChange,
        style: { width: '100%' },
      },
      fieldName: 'district',
      label: $t('page.account.district'),
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: $t('page.account.addressDetailPlaceholder'),
      },
      fieldName: 'addrDetail',
      label: $t('page.account.addressDetail'),
      rules: 'required',
    },
  ],
});

</script>

<template>
  <Modal>
    <div class="address-modal p-4">
      <div v-if="loading" class="flex-center py-10">
        <div class="text-center">{{ $t('page.account.loadingAddressData') }}</div>
      </div>
      <div v-else>
        <AddressForm />
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.address-modal {
  min-height: 300px;
}
</style>
