import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Item } from '../types/domain';
import apiClient from '../libs/apiClient';

type InventoryWithItem = {
  id?: string | number;
  itemId: string | number;
  units: number;
  item?: Item;
};

export const useInventory = defineStore('inventory', () => {
  // Store inventories by user ID
  const inventories = ref<Record<string, InventoryWithItem[]>>({});
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Fetch inventory for a specific user
  async function fetchUserInventory(userId: string): Promise<InventoryWithItem[]> {
    if (!userId) return [];
    
    loading.value = true;
    error.value = null;
    
    try {
      const response = await apiClient.getUserInventories(userId);
      if (response.ok) {
        const list = Array.isArray(response.data) ? response.data : [];
        const inventoryData: InventoryWithItem[] = list.map((inv: any) => ({
          id: inv.id,
          itemId: inv.itemId,
          units: Number(inv.units) || 0,
          item: inv.item
            ? {
                id: inv.item.id,
                name: inv.item.name,
                sku: inv.item.sku,
                isActive: inv.item.isActive ?? true,
                recipesOf: Array.isArray(inv.item.recipesOf) ? inv.item.recipesOf : [],
              } as Item
            : undefined,
        }));
        inventories.value[userId] = inventoryData;
        return inventoryData;
      }
      return [];
    } catch (err) {
      console.error('Failed to fetch user inventory:', err);
      error.value = 'Не удалось загрузить инвентарь пользователя';
      return [];
    } finally {
      loading.value = false;
    }
  }

  // Get inventory for a specific user
  function getInventoryForUser(userId: string): InventoryWithItem[] {
    return inventories.value[userId] || [];
  }

  return {
    // State
    inventories,
    loading,
    error,
    
    // Actions
    fetchUserInventory,
    getInventoryForUser,
  };
});
