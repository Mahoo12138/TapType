import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { ExportProgress, ImportProgress } from '@/utils/db/data-export'
import { exportDatabase, importDatabase } from '@/utils/db/data-export'
import { useCallback, useState } from 'react'

export default function DataSetting() {
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)

  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)

  const exportProgressCallback = useCallback(({ totalRows, completedRows, done }: ExportProgress) => {
    if (done) {
      setIsExporting(false)
      setExportProgress(100)
      return true
    }
    if (totalRows) {
      setExportProgress(Math.floor((completedRows / totalRows) * 100))
    }

    return true
  }, [])

  const onClickExport = useCallback(() => {
    setExportProgress(0)
    setIsExporting(true)
    exportDatabase(exportProgressCallback)
  }, [exportProgressCallback])

  const importProgressCallback = useCallback(({ totalRows, completedRows, done }: ImportProgress) => {
    if (done) {
      setIsImporting(false)
      setImportProgress(100)
      return true
    }
    if (totalRows) {
      setImportProgress(Math.floor((completedRows / totalRows) * 100))
    }

    return true
  }, [])

  const onStartImport = useCallback(() => {
    setImportProgress(0)
    setIsImporting(true)
  }, [])

  const onClickImport = useCallback(() => {
    importDatabase(onStartImport, importProgressCallback)
  }, [importProgressCallback, onStartImport])

  return (
    <ScrollArea className="flex-1 select-none overflow-y-auto">
      <div className="flex w-full flex-col items-start justify-start gap-10 overflow-y-auto pb-40 pl-6 pr-9 pt-8">
        <div className="flex w-full flex-col items-start gap-4">
          <span className="pb-0 text-xl font-medium text-gray-600 dark:text-gray-300">数据导出</span>
          <span className="-mt-1 pl-4 text-left text-xs font-normal leading-tight text-gray-600 dark:text-gray-400">
            目前，用户的练习数据<strong>仅保存在本地</strong>。如果您需要在不同的设备、浏览器或者其他非官方部署上使用 Qwerty Learner，
            您需要手动进行数据同步和保存。为了保留您的练习进度，以及使用近期即将上线的数据分析和智能训练功能，
            我们建议您及时备份您的数据。
          </span>
          <span className="pl-4 text-left text-sm font-bold leading-tight text-red-500">
            为了您的数据安全，请不要修改导出的数据文件。
          </span>
          <div className="flex h-3 w-full items-center justify-start px-5">
            <Progress value={exportProgress} className="w-11/12" />
            <span className="ml-4 w-10 text-xs font-normal text-gray-600 dark:text-gray-400">{`${exportProgress}%`}</span>
          </div>

          <Button
            className="ml-4"
            onClick={onClickExport}
            disabled={isExporting}
            title="导出数据"
          >
            导出数据
          </Button>
        </div>
        <div className="flex w-full flex-col items-start gap-4">
          <span className="pb-0 text-xl font-medium text-gray-600 dark:text-gray-300">数据导入</span>
          <span className="-mt-1 pl-4 text-left text-xs font-normal leading-tight text-gray-600 dark:text-gray-400">
            请注意，导入数据将<strong className="text-sm font-bold text-red-500"> 完全覆盖 </strong>当前数据。请谨慎操作。
          </span>

          <div className="flex h-3 w-full items-center justify-start px-5">
            <Progress value={importProgress} className="w-11/12" />
            <span className="ml-4 w-10 text-xs font-normal text-gray-600 dark:text-gray-400">{`${importProgress}%`}</span>
          </div>

          <Button
            className="ml-4"
            onClick={onClickImport}
            disabled={isImporting}
            title="导入数据"
          >
            导入数据
          </Button>
        </div>
      </div>
    </ScrollArea>
  )
}
