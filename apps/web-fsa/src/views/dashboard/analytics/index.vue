<script lang="ts" setup>
import type { AnalysisOverviewItem } from '@vben/common-ui';
import type { TabOption } from '@vben/types';

import { ref } from 'vue';

import {
  AnalysisChartsTabs,
  AnalysisOverview,
} from '@vben/common-ui';
import {
  SvgBellIcon,
  SvgCakeIcon,
  SvgCardIcon,
  SvgDownloadIcon,
} from '@vben/icons';
import { $t } from '#/locales';

import { Button, message, Upload } from 'ant-design-vue';

import { exportBackupApi, importBackupApi } from '#/api';

import AnalyticsTrends from './analytics-trends.vue';
import AnalyticsVisits from './analytics-visits.vue';

declare const __VBEN_ADMIN_METADATA__: {
  buildTime: string;
  dependencies: Record<string, string>;
};

const { buildTime, dependencies = {} } = __VBEN_ADMIN_METADATA__ || {};
const appVersion = dependencies['@vben/common-ui'] || '-';

const overviewItems: AnalysisOverviewItem[] = [
  {
    icon: SvgCardIcon,
    title: $t('page.dashboard.analytics.userCount'),
    totalTitle: $t('page.dashboard.analytics.totalUserCount'),
    totalValue: 120_000,
    value: 2000,
  },
  {
    icon: SvgCakeIcon,
    title: $t('page.dashboard.analytics.visitCount'),
    totalTitle: $t('page.dashboard.analytics.totalVisitCount'),
    totalValue: 500_000,
    value: 20_000,
  },
  {
    icon: SvgDownloadIcon,
    title: $t('page.dashboard.analytics.downloadCount'),
    totalTitle: $t('page.dashboard.analytics.totalDownloadCount'),
    totalValue: 120_000,
    value: 8000,
  },
  {
    icon: SvgBellIcon,
    title: $t('page.dashboard.analytics.usageCount'),
    totalTitle: $t('page.dashboard.analytics.totalUsageCount'),
    totalValue: 50_000,
    value: 5000,
  },
];

const chartTabs: TabOption[] = [
  {
    label: $t('page.dashboard.analytics.trafficTrend'),
    value: 'trends',
  },
  {
    label: $t('page.dashboard.analytics.monthlyVisits'),
    value: 'visits',
  },
];

const exporting = ref(false);
const importing = ref(false);

async function handleExport() {
  exporting.value = true;
  try {
    const blob = await exportBackupApi();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const url = URL.createObjectURL(blob as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fsa_backup_${timestamp}.sql`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('数据库备份已下载');
  } catch {
    message.error('导出失败');
  } finally {
    exporting.value = false;
  }
}

async function handleImport(file: File) {
  importing.value = true;
  try {
    await importBackupApi(file);
    message.success('数据库恢复成功');
  } catch {
    message.error('导入失败');
  } finally {
    importing.value = false;
  }
  return false;
}
</script>

<template>
  <div class="p-5">
    <AnalysisOverview :items="overviewItems" />
    <AnalysisChartsTabs :tabs="chartTabs" class="mt-5">
      <template #trends>
        <AnalyticsTrends />
      </template>
      <template #visits>
        <AnalyticsVisits />
      </template>
    </AnalysisChartsTabs>

    <div class="card-box mt-5 p-5">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-8">
          <div>
            <span class="text-sm text-foreground/60">版本号</span>
            <p class="mt-1 text-sm font-medium text-foreground">{{ appVersion }}</p>
          </div>
          <div>
            <span class="text-sm text-foreground/60">构建时间</span>
            <p class="mt-1 text-sm font-medium text-foreground">{{ buildTime }}</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <Button
            type="primary"
            :loading="exporting"
            @click="handleExport"
          >
            导出数据库
          </Button>
          <Upload
            :before-upload="handleImport"
            :show-upload-list="false"
            accept=".sql"
          >
            <Button :loading="importing" danger>
              导入数据库
            </Button>
          </Upload>
        </div>
      </div>
    </div>
  </div>
</template>
