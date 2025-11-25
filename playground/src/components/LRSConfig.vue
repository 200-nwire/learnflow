<template>
  <Card>
    <template #title>
      <div class="flex items-center gap-2">
        <i class="pi pi-cloud text-blue-500"></i>
        xAPI LRS Configuration
      </div>
    </template>
    <template #content>
      <div class="space-y-4">
        <!-- Enable/Disable Toggle -->
        <div class="flex items-center justify-between">
          <label class="font-medium">Enable LRS Integration</label>
          <InputSwitch v-model="config.enabled" @change="handleConfigChange" />
        </div>

        <Divider />

        <!-- Configuration Form -->
        <div v-if="config.enabled" class="space-y-4">
          <!-- Endpoint -->
          <div>
            <label class="block text-sm font-medium mb-1">LRS Endpoint</label>
            <InputText
              v-model="config.endpoint"
              placeholder="https://lrs.example.com/xapi"
              class="w-full"
              @blur="handleConfigChange"
            />
            <small class="text-gray-500">Full URL to your LRS endpoint</small>
          </div>

          <!-- Authentication Method -->
          <div>
            <label class="block text-sm font-medium mb-1">Authentication Method</label>
            <SelectButton
              v-model="authMethod"
              :options="authMethods"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
          </div>

          <!-- Basic Auth -->
          <div v-if="authMethod === 'basic'" class="space-y-3">
            <div>
              <label class="block text-sm font-medium mb-1">Username</label>
              <InputText
                v-model="config.username"
                placeholder="LRS username"
                class="w-full"
                @blur="handleConfigChange"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Password</label>
              <Password
                v-model="config.password"
                placeholder="LRS password"
                class="w-full"
                :feedback="false"
                toggleMask
                @blur="handleConfigChange"
              />
            </div>
          </div>

          <!-- Bearer Token -->
          <div v-if="authMethod === 'bearer'">
            <label class="block text-sm font-medium mb-1">Bearer Token</label>
            <Password
              v-model="config.authToken"
              placeholder="Bearer token"
              class="w-full"
              :feedback="false"
              toggleMask
              @blur="handleConfigChange"
            />
          </div>

          <!-- Advanced Options -->
          <Accordion :activeIndex="showAdvanced ? 0 : null">
            <AccordionTab header="Advanced Options">
              <div class="space-y-3">
                <div>
                  <label class="block text-sm font-medium mb-1">xAPI Version</label>
                  <InputText
                    v-model="config.version"
                    placeholder="1.0.3"
                    class="w-full"
                    @blur="handleConfigChange"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">Timeout (ms)</label>
                  <InputNumber
                    v-model="config.timeout"
                    :min="1000"
                    :max="60000"
                    :step="1000"
                    class="w-full"
                    @blur="handleConfigChange"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">Retry Attempts</label>
                  <InputNumber
                    v-model="config.retryAttempts"
                    :min="1"
                    :max="10"
                    class="w-full"
                    @blur="handleConfigChange"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">Retry Delay (ms)</label>
                  <InputNumber
                    v-model="config.retryDelay"
                    :min="100"
                    :max="10000"
                    :step="100"
                    class="w-full"
                    @blur="handleConfigChange"
                  />
                </div>
              </div>
            </AccordionTab>
          </Accordion>

          <!-- Test Connection -->
          <div class="flex gap-2">
            <Button
              label="Test Connection"
              icon="pi pi-check-circle"
              :loading="testing"
              @click="testConnection"
              :disabled="!config.endpoint"
              class="flex-1"
            />
            <Button
              label="Sync Now"
              icon="pi pi-sync"
              :loading="syncing"
              @click="syncNow"
              :disabled="!config.enabled"
              severity="secondary"
              outlined
            />
          </div>

          <!-- Test Result -->
          <Message
            v-if="testResult !== null"
            :severity="testResult.success ? 'success' : 'error'"
            :closable="true"
            @close="testResult = null"
          >
            <div v-if="testResult.success">
              <strong>Connection successful!</strong>
              <p class="mt-1 text-sm">LRS is reachable and authentication is valid.</p>
            </div>
            <div v-else>
              <strong>Connection failed</strong>
              <p class="mt-1 text-sm">{{ testResult.error }}</p>
            </div>
          </Message>

        </div>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useSessionWorker } from '../composables/useSessionWorker';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import InputSwitch from 'primevue/inputswitch';
import Password from 'primevue/password';
import Button from 'primevue/button';
import SelectButton from 'primevue/selectbutton';
import Accordion from 'primevue/accordion';
import AccordionTab from 'primevue/accordiontab';
import Message from 'primevue/message';
import Divider from 'primevue/divider';

const toast = useToast();
import { getTelemetryWorker, useTelemetryStats } from '@amit/telemetry/vue';

const telemetryStats = useTelemetryStats();
const worker = getTelemetryWorker();

const config = ref({
  enabled: false,
  endpoint: 'http://127.0.0.1:8000/trax/api/gateway/clients/default/stores/default/xapi',
  username: 'traxlrs',
  password: 'aaaaaaaa',
  authToken: '',
  version: '1.0.3',
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
});

const authMethod = ref<'basic' | 'bearer'>('basic');
const authMethods = [
  { label: 'Basic Auth', value: 'basic' },
  { label: 'Bearer Token', value: 'bearer' },
];

const showAdvanced = ref(false);
const testing = ref(false);
const syncing = ref(false);
const testResult = ref<{ success: boolean; error?: string } | null>(null);

const loadConfig = async () => {
  try {
    if (worker) {
      // Load from telemetry worker (which uses IndexedDB)
      // For now, try localStorage as fallback
      const stored = localStorage.getItem("amit-lrs-config");
      if (stored) {
        const saved = JSON.parse(stored);
        config.value = { ...config.value, ...saved };
        if (saved.authToken) {
          authMethod.value = 'bearer';
        } else {
          authMethod.value = 'basic';
        }
      }
    }
  } catch (error) {
    console.error('Failed to load LRS config:', error);
  }
};

const handleConfigChange = async () => {
  try {
    if (!worker) {
      toast.add({
        severity: 'warn',
        summary: 'Worker Not Available',
        detail: 'Telemetry worker is not initialized',
        life: 3000,
      });
      return;
    }

    // Clear authToken if using basic auth, clear username/password if using bearer
    const configToSave = { ...config.value };
    if (authMethod.value === 'basic') {
      delete configToSave.authToken;
    } else {
      delete configToSave.username;
      delete configToSave.password;
    }
    
    await worker.configureLRS(configToSave);
    toast.add({
      severity: 'success',
      summary: 'Configuration Saved',
      detail: 'LRS configuration has been updated',
      life: 2000,
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Configuration Error',
      detail: error instanceof Error ? error.message : 'Failed to save configuration',
      life: 3000,
    });
  }
};

const testConnection = async () => {
  if (!worker) {
    toast.add({
      severity: 'warn',
      summary: 'Worker Not Available',
      detail: 'Telemetry worker is not initialized',
      life: 3000,
    });
    return;
  }

  testing.value = true;
  testResult.value = null;
  
  try {
    // Save config first
    await handleConfigChange();
    
    // Wait a bit for config to be applied
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const result = await worker.testLRSConnection();
    testResult.value = result;
    
    if (result.success) {
      toast.add({
        severity: 'success',
        summary: 'Connection Test Successful',
        detail: 'LRS is reachable and authentication is valid',
        life: 3000,
      });
    } else {
      toast.add({
        severity: 'error',
        summary: 'Connection Test Failed',
        detail: result.error || 'Failed to connect to LRS',
        life: 3000,
      });
    }
  } catch (error) {
    testResult.value = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    toast.add({
      severity: 'error',
      summary: 'Test Error',
      detail: error instanceof Error ? error.message : 'Failed to test connection',
      life: 3000,
    });
  } finally {
    testing.value = false;
  }
};

const syncNow = async () => {
  if (!worker) {
    toast.add({
      severity: 'warn',
      summary: 'Worker Not Available',
      detail: 'Telemetry worker is not initialized',
      life: 3000,
    });
    return;
  }

  syncing.value = true;
  try {
    const result = await worker.syncXAPIStatements();
    toast.add({
      severity: result.failed === 0 ? 'success' : 'warn',
      summary: 'xAPI Sync',
      detail: `Synced ${result.synced} statements${result.failed > 0 ? `, ${result.failed} failed` : ''}`,
      life: 3000,
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Sync Error',
      detail: error instanceof Error ? error.message : 'Failed to sync statements',
      life: 3000,
    });
  } finally {
    syncing.value = false;
  }
};

// Watch for auth method changes
watch(authMethod, () => {
  handleConfigChange();
});

// Load config on mount
onMounted(() => {
  loadConfig();
});
</script>

<style scoped>
:deep(.p-card-body) {
  padding: 1.5rem;
}

:deep(.p-card-content) {
  padding: 0;
}
</style>

