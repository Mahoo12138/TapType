import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { request } from './client'
import { useSettingsStore } from '@/stores/settingsStore'
import type { SettingDefinitionsResponse, SystemSettingItem, UserControlItem } from '@/types/api'

export function usePublicSystemSettings(keys: string[]) {
  const q = keys.join(',')
  return useQuery({
    queryKey: ['settings', 'public-system', q],
    queryFn: () => request<Record<string, string>>(`/settings/public/system?keys=${encodeURIComponent(q)}`),
    staleTime: 60 * 1000,
  })
}

// ---- User settings ----

export function useUserSettings() {
  return useQuery({
    queryKey: ['settings', 'user'],
    queryFn: async () => {
      const data = await request<Record<string, string>>('/settings')
      useSettingsStore.getState().setUserSettings(data)
      return data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useSettingDefinitions() {
  return useQuery({
    queryKey: ['settings', 'definitions'],
    queryFn: () => request<SettingDefinitionsResponse>('/settings/definitions'),
    staleTime: 10 * 60 * 1000,
  })
}

export function useSaveSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      request<null>(`/settings/${encodeURIComponent(key)}`, {
        method: 'PUT',
        body: JSON.stringify({ value }),
      }),
    onMutate: ({ key, value }) => {
      useSettingsStore.getState().updateSetting(key, value)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  })
}

export function useBatchSaveSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (kvs: Record<string, string>) =>
      request<null>('/settings', {
        method: 'PUT',
        body: JSON.stringify({ settings: kvs }),
      }),
    onMutate: (kvs) => {
      const store = useSettingsStore.getState()
      Object.entries(kvs).forEach(([k, v]) => store.updateSetting(k, v))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  })
}

// ---- Admin system settings ----

export function useSystemSettings() {
  return useQuery({
    queryKey: ['settings', 'system'],
    queryFn: () => request<SystemSettingItem[]>('/admin/settings'),
    staleTime: 5 * 60 * 1000,
  })
}

export function useSaveSystemSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      request<null>(`/admin/settings/${encodeURIComponent(key)}`, {
        method: 'PUT',
        body: JSON.stringify({ value }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'system'] }),
  })
}

export function useUserControls() {
  return useQuery({
    queryKey: ['settings', 'user-controls'],
    queryFn: () => request<UserControlItem[]>('/admin/settings/user-controls'),
    staleTime: 5 * 60 * 1000,
  })
}

export function useSaveUserControl() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      key,
      isVisible,
      isEditable,
    }: {
      key: string
      isVisible?: boolean
      isEditable?: boolean
    }) =>
      request<null>(`/admin/settings/user-controls/${encodeURIComponent(key)}`, {
        method: 'PUT',
        body: JSON.stringify({ is_visible: isVisible, is_editable: isEditable }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'user-controls'] }),
  })
}
