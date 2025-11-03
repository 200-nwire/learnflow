<template>
  <div class="variants-editor">
    <!-- Main Content -->
    <div class="main-content">
      <div class="content-grid">
        <!-- Left Column: Pages & Blocks -->
        <div class="left-column">
          <!-- Header with Help -->
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-semibold text-gray-800">Content Variants Editor</h2>
            <Button
              icon="pi pi-question-circle"
              @click="showHelpDialog = true"
              rounded
              outlined
              severity="info"
              v-tooltip.left="'How variants work'"
              class="help-button"
            />
          </div>

          <!-- Pages List -->
          <Card>
            <template #title>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <i class="pi pi-file text-blue-600"></i>
                  <span>Pages</span>
                </div>
                <Button
                  icon="pi pi-plus"
                  label="Add Page"
                  @click="addPage"
                  size="small"
                  outlined
                />
              </div>
            </template>
            <template #content>
              <div class="pages-list">
                <div
                  v-for="page in pages"
                  :key="page.id"
                  class="page-item"
                  :class="{ 'active': selectedPageId === page.id }"
                  @click="selectPage(page.id)"
                >
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="font-medium">{{ page.title }}</div>
                      <div class="text-xs text-gray-500">{{ page.blocks.length }} blocks</div>
                    </div>
                    <Tag 
                      v-if="getTotalVariants(page) > 0"
                      :value="`${getTotalVariants(page)} variants`"
                      severity="success"
                      size="small"
                    />
                  </div>
                </div>
              </div>
            </template>
          </Card>

          <!-- Blocks for Selected Page -->
          <Card v-if="selectedPage">
            <template #title>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <i class="pi pi-th-large text-purple-600"></i>
                  <span>{{ selectedPage.title }} - Blocks</span>
                </div>
                <Button
                  icon="pi pi-plus"
                  label="Add Block"
                  @click="addBlock"
                  size="small"
                  outlined
                />
              </div>
            </template>
            <template #content>
              <div class="blocks-list">
                <div
                  v-for="block in selectedPage.blocks"
                  :key="block.id"
                  class="block-item"
                >
                  <div class="flex items-center justify-between p-3">
                    <div class="flex-1">
                      <div class="font-medium">{{ block.type }}</div>
                      <div class="text-xs text-gray-500">ID: {{ block.id }}</div>
                    </div>
                    <div class="flex items-center gap-2">
                      <Tag 
                        v-if="block.variants && block.variants.length > 0"
                        :value="`${block.variants.length} variants`"
                        severity="success"
                      />
                      <Button
                        :icon="block.variants && block.variants.length > 0 ? 'pi pi-pencil' : 'pi pi-plus'"
                        :label="block.variants && block.variants.length > 0 ? 'Edit' : 'Add Variants'"
                        @click="openVariantEditor(block)"
                        size="small"
                        :severity="block.variants && block.variants.length > 0 ? 'secondary' : 'success'"
                        outlined
                      />
                      <Button
                        icon="pi pi-trash"
                        @click="deleteBlock(block.id)"
                        size="small"
                        severity="danger"
                        outlined
                      />
                    </div>
                  </div>
                </div>

                <div v-if="selectedPage.blocks.length === 0" class="empty-state">
                  <i class="pi pi-inbox text-4xl text-gray-300"></i>
                  <p class="text-sm text-gray-500 mt-2">No blocks yet</p>
                  <Button
                    label="Add Your First Block"
                    icon="pi pi-plus"
                    @click="addBlock"
                    size="small"
                    class="mt-3"
                  />
                </div>
              </div>
            </template>
          </Card>
        </div>

        <!-- Right Column: Variant Editor & AI -->
        <div class="right-column">
          <!-- Quick Stats -->
          <Card>
            <template #title>
              <div class="flex items-center gap-2">
                <i class="pi pi-chart-bar text-green-600"></i>
                <span>Content Statistics</span>
              </div>
            </template>
            <template #content>
              <div class="grid grid-cols-2 gap-3">
                <div class="stat-item">
                  <div class="text-2xl font-bold text-blue-600">{{ pages.length }}</div>
                  <div class="text-xs text-gray-600">Pages</div>
                </div>
                <div class="stat-item">
                  <div class="text-2xl font-bold text-purple-600">{{ totalBlocks }}</div>
                  <div class="text-xs text-gray-600">Blocks</div>
                </div>
                <div class="stat-item">
                  <div class="text-2xl font-bold text-green-600">{{ totalVariants }}</div>
                  <div class="text-xs text-gray-600">Variants</div>
                </div>
                <div class="stat-item">
                  <div class="text-2xl font-bold text-orange-600">{{ blocksWithVariants }}</div>
                  <div class="text-xs text-gray-600">Adaptive</div>
                </div>
              </div>
            </template>
          </Card>

          <!-- AI Assistant -->
          <Card class="ai-card">
            <template #title>
              <div class="flex items-center gap-2">
                <i class="pi pi-sparkles text-yellow-600"></i>
                <span>AI Assistant</span>
                <Tag value="Beta" severity="warning" size="small" />
              </div>
            </template>
            <template #content>
              <div class="space-y-4">
                <p class="text-sm text-gray-700">
                  Let AI help you create and refine content variants for personalized learning.
                </p>

                <div class="ai-actions">
                  <Button
                    label="Generate Variants"
                    icon="pi pi-sparkles"
                    @click="aiGenerateVariants"
                    :loading="aiLoading"
                    severity="warning"
                    outlined
                    class="w-full"
                  />
                  <Button
                    label="Refine Existing"
                    icon="pi pi-pen-to-square"
                    @click="aiRefineVariants"
                    :loading="aiLoading"
                    severity="secondary"
                    outlined
                    class="w-full"
                  />
                  <Button
                    label="Suggest Improvements"
                    icon="pi pi-lightbulb"
                    @click="aiSuggest"
                    :loading="aiLoading"
                    severity="secondary"
                    outlined
                    class="w-full"
                  />
                </div>

                <!-- AI Response Area -->
                <div v-if="aiResponse" class="ai-response">
                  <div class="flex items-start gap-2">
                    <i class="pi pi-comment text-blue-600 mt-1"></i>
                    <div class="flex-1">
                      <div class="text-sm font-semibold mb-1">AI Response:</div>
                      <div class="text-sm text-gray-700">{{ aiResponse }}</div>
                    </div>
                  </div>
                  <Button
                    label="Apply Suggestions"
                    icon="pi pi-check"
                    @click="aiApplySuggestions"
                    size="small"
                    severity="success"
                    class="w-full mt-3"
                  />
                </div>

                <!-- AI Loading Skeleton -->
                <div v-if="aiLoading" class="ai-loading">
                  <Skeleton height="2rem" class="mb-2" />
                  <Skeleton height="4rem" class="mb-2" />
                  <Skeleton height="2rem" width="70%" />
                </div>
              </div>
            </template>
          </Card>

          <!-- Variant Dimensions Guide -->
          <Card>
            <template #title>
              <div class="flex items-center gap-2">
                <i class="pi pi-info-circle text-blue-600"></i>
                <span>Variant Dimensions</span>
              </div>
            </template>
            <template #content>
              <div class="space-y-3 text-sm">
                <div class="dimension-info">
                  <div class="font-semibold text-blue-900">Difficulty</div>
                  <div class="text-gray-600">Easy, Standard, Hard</div>
                </div>
                <Divider />
                <div class="dimension-info">
                  <div class="font-semibold text-purple-900">Modality</div>
                  <div class="text-gray-600">Text, Video, Audio, Interactive</div>
                </div>
                <Divider />
                <div class="dimension-info">
                  <div class="font-semibold text-green-900">Theme</div>
                  <div class="text-gray-600">Soccer, Space, Nature, Abstract</div>
                </div>
                <Divider />
                <div class="dimension-info">
                  <div class="font-semibold text-orange-900">Language</div>
                  <div class="text-gray-600">Formal, Casual, Simple</div>
                </div>
              </div>
            </template>
          </Card>
        </div>
      </div>
    </div>

    <!-- Variant Editor Dialog -->
    <Dialog
      v-model:visible="showVariantEditor"
      :header="`Variants for Block: ${editingBlock?.id}`"
      :modal="true"
      :style="{ width: '900px' }"
      class="variant-editor-dialog"
    >
      <div v-if="editingBlock" class="space-y-4">
        <!-- Step 1: Select Dimensions -->
        <Card v-if="!variantsGenerated">
          <template #title>
            <div class="flex items-center gap-2">
              <span class="text-lg">Step 1: Select Variant Dimensions</span>
            </div>
          </template>
          <template #content>
            <div class="space-y-4">
              <p class="text-sm text-gray-600">
                Choose which dimensions to vary. Each combination will create a unique variant.
              </p>

              <div class="dimensions-selector">
                <div
                  v-for="dim in availableDimensions"
                  :key="dim.name"
                  class="dimension-card"
                  :class="{ 'selected': selectedDimensions[dim.name] }"
                  @click="toggleDimension(dim.name)"
                >
                  <Checkbox
                    :modelValue="selectedDimensions[dim.name]"
                    :binary="true"
                    @update:modelValue="toggleDimension(dim.name)"
                  />
                  <div class="ml-3 flex-1">
                    <div class="font-semibold">{{ dim.label }}</div>
                    <div class="text-xs text-gray-500">{{ dim.values.length }} options</div>
                    <div class="flex flex-wrap gap-1 mt-2">
                      <Tag
                        v-for="val in dim.values"
                        :key="val"
                        :value="val"
                        size="small"
                        severity="secondary"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div class="text-sm">
                  <span class="font-semibold">{{ calculatedVariantCount }}</span> variants will be generated
                </div>
                <Button
                  label="Generate Variants"
                  icon="pi pi-check"
                  @click="generateVariants"
                  :disabled="calculatedVariantCount === 0"
                  severity="success"
                />
              </div>
            </div>
          </template>
        </Card>

        <!-- Step 2: Configure Variants -->
        <div v-else class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Step 2: Configure Generated Variants</h3>
            <div class="flex gap-2">
              <Button
                label="AI Enhance All"
                icon="pi pi-sparkles"
                @click="aiEnhanceAllVariants"
                size="small"
                severity="warning"
                outlined
              />
              <Button
                label="Back"
                icon="pi pi-arrow-left"
                @click="variantsGenerated = false"
                size="small"
                outlined
              />
            </div>
          </div>

          <div class="variants-grid">
            <div
              v-for="(variant, index) in editingBlock.variants"
              :key="variant.id"
              class="variant-card"
            >
              <div class="variant-header">
                <div class="flex items-center gap-2">
                  <i class="pi pi-tag text-purple-600"></i>
                  <span class="font-semibold">Variant {{ index + 1 }}</span>
                </div>
                <div class="flex gap-1">
                  <Button
                    icon="pi pi-sparkles"
                    @click="aiEnhanceVariant(variant)"
                    size="small"
                    severity="warning"
                    text
                    rounded
                    v-tooltip="'AI enhance'"
                  />
                  <Button
                    icon="pi pi-trash"
                    @click="removeVariant(variant.id)"
                    size="small"
                    severity="danger"
                    text
                    rounded
                    v-tooltip="'Remove'"
                  />
                </div>
              </div>

              <div class="variant-body">
                <!-- Meta Tags -->
                <div class="flex flex-wrap gap-1 mb-3">
                  <Tag
                    v-for="(value, key) in variant.meta"
                    :key="key"
                    :value="`${key}: ${value}`"
                    :severity="getTagSeverity(key as string)"
                    size="small"
                  />
                </div>

                <!-- Content Input -->
                <div>
                  <label class="block text-xs font-semibold mb-1 uppercase text-gray-600">Content</label>
                  <Textarea
                    v-model="variant.content"
                    :placeholder="`Enter content for this variant...`"
                    :autoResize="true"
                    rows="3"
                    class="w-full"
                  />
                </div>

                <!-- Additional Fields -->
                <div class="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <label class="block text-xs font-semibold mb-1">Duration (sec)</label>
                    <InputNumber
                      v-model="variant.duration"
                      :min="10"
                      :max="600"
                      showButtons
                      buttonLayout="horizontal"
                      class="w-full"
                      size="small"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold mb-1">Score Weight</label>
                    <InputNumber
                      v-model="variant.scoreWeight"
                      :min="0"
                      :max="10"
                      :step="0.5"
                      showButtons
                      buttonLayout="horizontal"
                      class="w-full"
                      size="small"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-4 border-t">
            <Button
              label="Cancel"
              icon="pi pi-times"
              @click="closeVariantEditor"
              outlined
            />
            <Button
              label="Save Variants"
              icon="pi pi-check"
              @click="saveVariants"
              severity="success"
            />
          </div>
        </div>
      </div>
    </Dialog>

    <!-- Help Dialog -->
    <Dialog
      v-model:visible="showHelpDialog"
      header="Content Variants Editor"
      :modal="true"
      :dismissableMask="true"
      :style="{ width: '700px' }"
    >
      <div class="space-y-4 text-sm">
        <div>
          <h4 class="font-semibold text-purple-900 mb-2 flex items-center gap-2">
            <i class="pi pi-eye text-purple-600"></i>
            What Are Variants?
          </h4>
          <p class="text-gray-700 leading-relaxed">
            <strong>Variants</strong> are different versions of the same content block, each tailored for 
            different learner needs. Like a math problem that has an "easy" version with hints, a "standard" 
            version, and a "hard" version with extra challenges — all teaching the same concept.
          </p>
        </div>

        <Divider />

        <div>
          <h4 class="font-semibold text-purple-900 mb-2 flex items-center gap-2">
            <i class="pi pi-cog text-purple-600"></i>
            How to Create Variants
          </h4>
          <ol class="space-y-2 text-gray-700 list-decimal list-inside">
            <li><strong>Create a page</strong> - Add pages to organize your content</li>
            <li><strong>Add blocks</strong> - Each block is a content unit (text, question, video, etc.)</li>
            <li><strong>Add variants</strong> - Click "Add Variants" on any block</li>
            <li><strong>Select dimensions</strong> - Choose what varies (difficulty, modality, theme, language)</li>
            <li><strong>Generate matrix</strong> - System creates all combinations automatically</li>
            <li><strong>Configure each variant</strong> - Edit content, duration, and metadata</li>
            <li><strong>Use AI</strong> - Let AI generate or refine variant content</li>
          </ol>
        </div>

        <Divider />

        <div>
          <h4 class="font-semibold text-purple-900 mb-2 flex items-center gap-2">
            <i class="pi pi-th-large text-purple-600"></i>
            Variant Matrix (Product-Style)
          </h4>
          <p class="text-gray-700 leading-relaxed mb-2">
            Like product variants (Small/Blue, Medium/Red), content variants combine dimensions:
          </p>
          <div class="bg-gray-50 p-3 rounded border border-gray-200 text-xs font-mono">
            <div>Difficulty × Modality = Variants</div>
            <div class="text-gray-600 mt-1">
              [Easy, Standard, Hard] × [Text, Video] = 6 variants
            </div>
          </div>
        </div>

        <Divider />

        <div>
          <h4 class="font-semibold text-purple-900 mb-2 flex items-center gap-2">
            <i class="pi pi-sparkles text-purple-600"></i>
            AI Integration
          </h4>
          <ul class="space-y-1.5 text-gray-700">
            <li class="flex items-start gap-2">
              <i class="pi pi-angle-right text-purple-500 mt-0.5"></i>
              <span><strong>Generate:</strong> AI creates content for all variants based on your prompts</span>
            </li>
            <li class="flex items-start gap-2">
              <i class="pi pi-angle-right text-purple-500 mt-0.5"></i>
              <span><strong>Refine:</strong> AI improves existing variant content</span>
            </li>
            <li class="flex items-start gap-2">
              <i class="pi pi-angle-right text-purple-500 mt-0.5"></i>
              <span><strong>Suggest:</strong> AI recommends better dimension combinations</span>
            </li>
          </ul>
        </div>

        <Divider />

        <div>
          <h4 class="font-semibold text-purple-900 mb-2 flex items-center gap-2">
            <i class="pi pi-star text-purple-600"></i>
            Why Variants Matter
          </h4>
          <p class="text-gray-700 leading-relaxed">
            Instead of creating separate content for different learners, variants let you author once and 
            adapt infinitely. The adaptive engine automatically selects the best variant for each student 
            based on their performance, preferences, and context — making learning truly personalized at scale.
          </p>
        </div>

        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div class="flex items-start gap-2">
            <i class="pi pi-lightbulb text-yellow-600 mt-0.5"></i>
            <div class="text-xs text-yellow-900">
              <strong>Pro Tip:</strong> Start with difficulty variants (easy/std/hard) for maximum impact. 
              Add modality and theme variants as you scale your content library.
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Dialog from 'primevue/dialog';
import Divider from 'primevue/divider';
import Tag from 'primevue/tag';
import Checkbox from 'primevue/checkbox';
import Textarea from 'primevue/textarea';
import InputNumber from 'primevue/inputnumber';
import Skeleton from 'primevue/skeleton';

const toast = useToast();
const showHelpDialog = ref(false);
const showVariantEditor = ref(false);
const selectedPageId = ref<string | null>(null);
const editingBlock = ref<any>(null);
const variantsGenerated = ref(false);
const aiLoading = ref(false);
const aiResponse = ref<string | null>(null);

// Variant dimensions configuration
const availableDimensions = [
  {
    name: 'difficulty',
    label: 'Difficulty Level',
    values: ['easy', 'std', 'hard'],
  },
  {
    name: 'modality',
    label: 'Content Modality',
    values: ['text', 'video', 'audio', 'interactive'],
  },
  {
    name: 'theme',
    label: 'Visual Theme',
    values: ['soccer', 'space', 'nature', 'abstract'],
  },
  {
    name: 'language',
    label: 'Language Style',
    values: ['formal', 'casual', 'simple'],
  },
];

const selectedDimensions = reactive<Record<string, boolean>>({
  difficulty: false,
  modality: false,
  theme: false,
  language: false,
});

// Sample pages data
const pages = ref([
  {
    id: 'page_1',
    title: 'Introduction to Fractions',
    blocks: [],
  },
  {
    id: 'page_2',
    title: 'Adding Fractions',
    blocks: [],
  },
  {
    id: 'page_3',
    title: 'Practice Problems',
    blocks: [],
  },
]);

let blockIdCounter = 1;
let variantIdCounter = 1;

const selectedPage = computed(() => {
  return pages.value.find(p => p.id === selectedPageId.value);
});

const totalBlocks = computed(() => {
  return pages.value.reduce((sum, page) => sum + page.blocks.length, 0);
});

const totalVariants = computed(() => {
  return pages.value.reduce((sum, page) => {
    return sum + page.blocks.reduce((blockSum: number, block: any) => {
      return blockSum + (block.variants?.length || 0);
    }, 0);
  }, 0);
});

const blocksWithVariants = computed(() => {
  return pages.value.reduce((sum, page) => {
    return sum + page.blocks.filter((block: any) => block.variants && block.variants.length > 0).length;
  }, 0);
});

const calculatedVariantCount = computed(() => {
  const activeDimensions = Object.entries(selectedDimensions)
    .filter(([_, active]) => active)
    .map(([name, _]) => availableDimensions.find(d => d.name === name)!);
  
  if (activeDimensions.length === 0) return 0;
  
  return activeDimensions.reduce((count, dim) => count * dim.values.length, 1);
});

const addPage = () => {
  const pageNum = pages.value.length + 1;
  pages.value.push({
    id: `page_${pageNum}`,
    title: `Page ${pageNum}`,
    blocks: [],
  });
  
  toast.add({
    severity: 'success',
    summary: 'Page Added',
    detail: `Page ${pageNum} created`,
    life: 2000,
  });
};

const selectPage = (pageId: string) => {
  selectedPageId.value = pageId;
};

const addBlock = () => {
  if (!selectedPage.value) return;
  
  const blockTypes = ['text', 'question', 'video', 'interactive', 'image'];
  const randomType = blockTypes[Math.floor(Math.random() * blockTypes.length)];
  
  const newBlock = {
    id: `block_${blockIdCounter++}`,
    type: randomType,
    variants: null,
  };
  
  selectedPage.value.blocks.push(newBlock);
  
  toast.add({
    severity: 'success',
    summary: 'Block Added',
    detail: `${randomType} block created`,
    life: 2000,
  });
};

const deleteBlock = (blockId: string) => {
  if (!selectedPage.value) return;
  
  const index = selectedPage.value.blocks.findIndex((b: any) => b.id === blockId);
  if (index > -1) {
    selectedPage.value.blocks.splice(index, 1);
    toast.add({
      severity: 'info',
      summary: 'Block Deleted',
      life: 2000,
    });
  }
};

const getTotalVariants = (page: any) => {
  return page.blocks.reduce((sum: number, block: any) => {
    return sum + (block.variants?.length || 0);
  }, 0);
};

const toggleDimension = (dimName: string) => {
  selectedDimensions[dimName] = !selectedDimensions[dimName];
};

const openVariantEditor = (block: any) => {
  editingBlock.value = block;
  showVariantEditor.value = true;
  variantsGenerated.value = block.variants && block.variants.length > 0;
  
  // Reset selections if no variants yet
  if (!variantsGenerated.value) {
    Object.keys(selectedDimensions).forEach(key => {
      selectedDimensions[key] = false;
    });
    selectedDimensions.difficulty = true; // Default to difficulty
  }
};

const closeVariantEditor = () => {
  showVariantEditor.value = false;
  editingBlock.value = null;
  variantsGenerated.value = false;
};

const generateVariants = () => {
  if (!editingBlock.value) return;
  
  const activeDimensions = Object.entries(selectedDimensions)
    .filter(([_, active]) => active)
    .map(([name, _]) => availableDimensions.find(d => d.name === name)!);
  
  // Generate all combinations
  const generateCombinations = (dimensions: typeof activeDimensions): any[] => {
    if (dimensions.length === 0) return [{}];
    
    const [first, ...rest] = dimensions;
    const restCombinations = generateCombinations(rest);
    
    const combinations: any[] = [];
    first.values.forEach(value => {
      restCombinations.forEach(combo => {
        combinations.push({
          [first.name]: value,
          ...combo,
        });
      });
    });
    
    return combinations;
  };
  
  const combinations = generateCombinations(activeDimensions);
  
  editingBlock.value.variants = combinations.map(meta => ({
    id: `var_${variantIdCounter++}`,
    meta,
    content: `[${Object.values(meta).join(', ')}] variant content here...`,
    duration: 60,
    scoreWeight: 1,
  }));
  
  variantsGenerated.value = true;
  
  toast.add({
    severity: 'success',
    summary: 'Variants Generated',
    detail: `Created ${combinations.length} variants`,
    life: 3000,
  });
};

const saveVariants = () => {
  closeVariantEditor();
  
  toast.add({
    severity: 'success',
    summary: 'Variants Saved',
    detail: `${editingBlock.value.variants.length} variants saved to block`,
    life: 2000,
  });
};

const removeVariant = (variantId: string) => {
  if (!editingBlock.value?.variants) return;
  
  const index = editingBlock.value.variants.findIndex((v: any) => v.id === variantId);
  if (index > -1) {
    editingBlock.value.variants.splice(index, 1);
    toast.add({
      severity: 'info',
      summary: 'Variant Removed',
      life: 2000,
    });
  }
};

const getTagSeverity = (key: string) => {
  const severities: Record<string, any> = {
    difficulty: 'info',
    modality: 'success',
    theme: 'warning',
    language: 'secondary',
  };
  return severities[key] || 'secondary';
};

// AI Simulation Functions
const aiGenerateVariants = async () => {
  aiLoading.value = true;
  aiResponse.value = null;
  
  // Simulate AI processing
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  aiResponse.value = "I can help you create comprehensive variants! I suggest starting with difficulty (easy/standard/hard) and modality (text/video/interactive). This creates 9 base variants that cover most learner needs. Would you like me to generate content for these?";
  
  aiLoading.value = false;
  
  toast.add({
    severity: 'success',
    summary: 'AI Ready',
    detail: 'Review AI suggestions',
    life: 2000,
  });
};

const aiRefineVariants = async () => {
  aiLoading.value = true;
  aiResponse.value = null;
  
  await new Promise(resolve => setTimeout(resolve, 1800));
  
  aiResponse.value = "I analyzed your existing variants and found opportunities to improve clarity and engagement. For 'easy' variants, I recommend adding more scaffolding. For 'hard' variants, consider adding challenge extensions. Shall I apply these refinements?";
  
  aiLoading.value = false;
};

const aiSuggest = async () => {
  aiLoading.value = true;
  aiResponse.value = null;
  
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  aiResponse.value = "Based on your content type, I recommend: 1) Add 'language style' variants for different reading levels, 2) Consider 'theme' variants (soccer, space) for engagement, 3) Your difficulty progression looks good!";
  
  aiLoading.value = false;
};

const aiEnhanceVariant = async (variant: any) => {
  toast.add({
    severity: 'info',
    summary: 'AI Enhancing...',
    detail: 'Improving variant content',
    life: 1500,
  });
  
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Simulate AI enhancement
  variant.content = `[AI Enhanced] ${variant.content}\n\nAdditional context and scaffolding added for better learning outcomes.`;
  
  toast.add({
    severity: 'success',
    summary: 'Enhanced!',
    detail: 'Variant improved by AI',
    life: 2000,
  });
};

const aiEnhanceAllVariants = async () => {
  if (!editingBlock.value?.variants) return;
  
  toast.add({
    severity: 'info',
    summary: 'AI Processing',
    detail: `Enhancing ${editingBlock.value.variants.length} variants...`,
    life: 2000,
  });
  
  aiLoading.value = true;
  
  for (const variant of editingBlock.value.variants) {
    await new Promise(resolve => setTimeout(resolve, 500));
    variant.content = `[AI Enhanced] ${variant.content}`;
  }
  
  aiLoading.value = false;
  
  toast.add({
    severity: 'success',
    summary: 'All Variants Enhanced',
    detail: 'AI improvements applied',
    life: 3000,
  });
};

const aiApplySuggestions = () => {
  toast.add({
    severity: 'success',
    summary: 'Suggestions Applied',
    detail: 'AI recommendations implemented',
    life: 2000,
  });
  
  aiResponse.value = null;
};

// Auto-select first page
if (pages.value.length > 0) {
  selectedPageId.value = pages.value[0].id;
}
</script>

<style scoped>
.variants-editor {
  height: calc(100vh - 105px);
  overflow: hidden;
}

.main-content {
  height: 100%;
  overflow: hidden;
  padding: 1.5rem;
  max-width: 1600px;
  margin: 0 auto;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  height: 100%;
  overflow: hidden;
}

@media (min-width: 1280px) {
  .content-grid {
    grid-template-columns: 1.5fr 1fr;
  }
}

.left-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 0.5rem;
  height: 100%;
}

.pages-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.page-item {
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.page-item:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.page-item.active {
  border-color: #3b82f6;
  background: #dbeafe;
}

.blocks-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.block-item {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.block-item:hover {
  border-color: #8b5cf6;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.1);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem 2rem;
  text-align: center;
}

.stat-item {
  text-align: center;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.ai-card {
  border: 2px solid #fbbf24;
  background: linear-gradient(to bottom, #fffbeb, white);
}

.ai-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.ai-response {
  padding: 1rem;
  background: #eff6ff;
  border: 1px solid #93c5fd;
  border-radius: 0.5rem;
}

.ai-loading {
  padding: 1rem;
}

.dimensions-selector {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.dimension-card {
  display: flex;
  align-items: start;
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.dimension-card:hover {
  border-color: #8b5cf6;
  background: #faf5ff;
}

.dimension-card.selected {
  border-color: #8b5cf6;
  background: #f3e8ff;
}

.variants-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  max-height: 500px;
  overflow-y: auto;
  padding: 0.5rem;
}

.variant-card {
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
  transition: all 0.2s;
}

.variant-card:hover {
  border-color: #8b5cf6;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
}

.variant-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: linear-gradient(to right, #fafafa, white);
  border-bottom: 1px solid #e5e7eb;
}

.variant-body {
  padding: 1rem;
}

.dimension-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.help-button {
  width: 40px;
  height: 40px;
  animation: pulse-subtle 3s ease-in-out infinite;
}

.help-button:hover {
  animation: none;
}

@keyframes pulse-subtle {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(59, 130, 246, 0);
  }
}
</style>
