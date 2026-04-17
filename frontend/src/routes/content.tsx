import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import {
  BookOpen,
  CaseSensitive,
  ChevronRight,
  FileText,
  FileUp,
  Plus,
  Save,
  Search,
  Trash2,
  Type,
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  useWordBanks,
  useCreateWordBank,
  useUpdateWordBank,
  useDeleteWordBank,
  useWords,
  useCreateWord,
  useUpdateWord,
  useDeleteWord,
  useImportWords,
} from '@/api/wordBanks'
import {
  useSentenceBanks,
  useCreateSentenceBank,
  useUpdateSentenceBank,
  useDeleteSentenceBank,
  useSentences,
  useCreateSentence,
  useUpdateSentence,
  useDeleteSentence,
  useImportSentences,
} from '@/api/sentenceBanks'
import {
  useArticleBanks,
  useCreateArticleBank,
  useUpdateArticleBank,
  useDeleteArticleBank,
  useArticles,
  useCreateArticle,
  useDeleteArticle,
  useArticleDetail,
  useArticleSentences,
  useUpdateArticleSentence,
  useArticleProgress,
  useResetProgress,
} from '@/api/articleBanks'
import type { Article, ArticleBank, ArticleSentence, ProgressItem, Sentence, SentenceBank, WordBank } from '@/types/api'

const contentTabs = ['word', 'sentence', 'article'] as const
type ContentTab = (typeof contentTabs)[number]

function parseContentTab(value: unknown): ContentTab {
  return typeof value === 'string' && contentTabs.includes(value as ContentTab)
    ? (value as ContentTab)
    : 'word'
}

function parsePositiveInt(value: unknown, fallback: number) {
  if (typeof value !== 'string') return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export const Route = createFileRoute('/content')({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: parseContentTab(search.tab),
    wordPage: parsePositiveInt(search.wordPage, 1),
  }),
  component: Content,
})

function Content() {
  const navigate = useNavigate()
  const { tab } = Route.useSearch()

  const handleTabChange = (nextTab: ContentTab) => {
    void navigate({
      to: '/content',
      search: (prev) => ({ ...prev, tab: nextTab, wordPage: prev.wordPage ?? 1 }),
    })
  }

  return (
    <div className="mx-auto max-w-7xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            内容管理
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            管理词库、句库与文章库，支持增删改查和批量导入。
          </p>
        </div>
        <BookOpen className="h-7 w-7 text-indigo-500 dark:text-indigo-400" />
      </div>

      <div className="mb-6 inline-flex rounded-xl border border-border bg-card p-1">
        <Button
          onClick={() => handleTabChange('word')}
          variant={tab === 'word' ? 'default' : 'ghost'}
          size="sm"
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'word' ? '' : 'text-muted-foreground'
          }`}
        >
          词库管理
        </Button>
        <Button
          onClick={() => handleTabChange('sentence')}
          variant={tab === 'sentence' ? 'default' : 'ghost'}
          size="sm"
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'sentence' ? '' : 'text-muted-foreground'
          }`}
        >
          句库管理
        </Button>
        <Button
          onClick={() => handleTabChange('article')}
          variant={tab === 'article' ? 'default' : 'ghost'}
          size="sm"
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'article' ? '' : 'text-muted-foreground'
          }`}
        >
          文章库
        </Button>
      </div>

      {tab === 'word' && <WordPanel />}
      {tab === 'sentence' && <SentencePanel />}
      {tab === 'article' && <ArticlePanel />}
    </div>
  )
}

function PaginationControls({
  page,
  totalPages,
  itemLabel,
  onPrev,
  onNext,
}: {
  page: number
  totalPages: number
  itemLabel: string
  onPrev: () => void
  onNext: () => void
}) {
  if (totalPages <= 1) return null

  return (
    <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
      <span className="text-xs text-slate-500 dark:text-slate-400">
        {itemLabel} 第 {page} / {totalPages} 页
      </span>
      <div className="flex gap-2">
        <Button onClick={onPrev} disabled={page <= 1} variant="outline" size="sm">
          上一页
        </Button>
        <Button onClick={onNext} disabled={page >= totalPages} variant="outline" size="sm">
          下一页
        </Button>
      </div>
    </div>
  )
}

function WordPanel() {
  const navigate = useNavigate()
  const { wordPage } = Route.useSearch()
  const [selectedBankId, setSelectedBankId] = useState('')
  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState(0)
  const [bankName, setBankName] = useState('')
  const [bankDesc, setBankDesc] = useState('')
  const [editingBankName, setEditingBankName] = useState('')
  const [editingBankDescription, setEditingBankDescription] = useState('')
  const [wordContent, setWordContent] = useState('')
  const [wordDefinition, setWordDefinition] = useState('')
  const [wordDifficulty, setWordDifficulty] = useState(3)
  const pageSize = 20

  const { data: banks = [] } = useWordBanks()
  const createBank = useCreateWordBank()
  const updateBank = useUpdateWordBank()
  const deleteBank = useDeleteWordBank()

  const { data: wordsData } = useWords(selectedBankId, wordPage, pageSize, search, difficulty)
  const createWord = useCreateWord()
  const updateWord = useUpdateWord()
  const deleteWord = useDeleteWord()
  const importWords = useImportWords()

  const selectedBank = useMemo(
    () => banks.find((b) => b.id === selectedBankId),
    [banks, selectedBankId],
  )
  const totalPages = Math.max(1, Math.ceil((wordsData?.total ?? 0) / pageSize))

  useEffect(() => {
    if (!selectedBank) {
      setEditingBankName('')
      setEditingBankDescription('')
      return
    }

    setEditingBankName(selectedBank.name)
    setEditingBankDescription(selectedBank.description ?? '')
  }, [selectedBank?.id])

  useEffect(() => {
    if (wordPage <= totalPages) return

    void navigate({
      to: '/content',
      search: (prev) => ({ ...prev, tab: 'word', wordPage: totalPages }),
      replace: true,
    })
  }, [navigate, totalPages, wordPage])

  const updateWordPage = (nextPage: number, replace = false) => {
    void navigate({
      to: '/content',
      search: (prev) => ({ ...prev, tab: 'word', wordPage: Math.max(1, nextPage) }),
      replace,
    })
  }

  const handleCreateBank = () => {
    if (!bankName.trim()) return
    createBank.mutate(
      { name: bankName.trim(), description: bankDesc.trim() },
      {
        onSuccess: (bank) => {
          setSelectedBankId(bank.id)
          setBankName('')
          setBankDesc('')
        },
      },
    )
  }

  const handleSaveBank = () => {
    if (!selectedBank || !editingBankName.trim()) return

    updateBank.mutate({
      id: selectedBank.id,
      name: editingBankName.trim(),
      description: editingBankDescription.trim(),
    })
  }

  const handleDeleteBank = () => {
    if (!selectedBank) return
    if (!window.confirm(`确定删除词库「${selectedBank.name}」吗？`)) return

    deleteBank.mutate(selectedBank.id, {
      onSuccess: () => {
        setSelectedBankId('')
        setEditingBankName('')
        setEditingBankDescription('')
      },
    })
  }

  const handleCreateWord = () => {
    if (!selectedBankId || !wordContent.trim()) return
    createWord.mutate(
      {
        bankId: selectedBankId,
        content: wordContent.trim(),
        definition: wordDefinition.trim(),
        difficulty: wordDifficulty,
      },
      {
        onSuccess: () => {
          setWordContent('')
          setWordDefinition('')
          setWordDifficulty(3)
        },
      },
    )
  }

  const handleImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedBankId) return
    const format = file.name.endsWith('.csv') ? 'csv' : 'json'
    importWords.mutate({ bankId: selectedBankId, file, format })
    e.target.value = ''
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>词库列表</CardTitle>
        </CardHeader>
        <CardContent>
        <div className="mb-4 space-y-2">
          {banks.map((bank: WordBank) => (
            <Button
              key={bank.id}
              onClick={() => {
                setSelectedBankId(bank.id)
                updateWordPage(1, true)
              }}
              variant={selectedBankId === bank.id ? 'secondary' : 'ghost'}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors ${
                selectedBankId === bank.id
                  ? 'text-primary'
                  : 'text-foreground'
              }`}
            >
              <span className="truncate text-sm font-medium">{bank.name}</span>
              <span className="text-xs opacity-70">{bank.word_count}</span>
            </Button>
          ))}
          {banks.length === 0 && (
            <p className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              还没有词库，先创建一个。
            </p>
          )}
        </div>

        <div className="space-y-2 border-t border-slate-200 pt-4 dark:border-slate-800">
          <Input
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="新词库名称"
          />
          <Input
            value={bankDesc}
            onChange={(e) => setBankDesc(e.target.value)}
            placeholder="词库描述（可选）"
          />
          <Button
            onClick={handleCreateBank}
            className="w-full"
          >
            <Plus className="h-4 w-4" />
            创建词库
          </Button>
        </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {selectedBank ? `${selectedBank.name} · 单词管理` : '请选择词库'}
          </h2>
          {selectedBank && (
            <div className="flex gap-2">
              <label className="cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                <FileUp className="mr-1 inline h-3.5 w-3.5" />导入
                <input type="file" accept=".json,.csv" onChange={handleImport} className="hidden" />
              </label>
            </div>
          )}
        </div>

        {selectedBank && (
          <>
            <div className="mb-4 grid grid-cols-1 gap-2 lg:grid-cols-[1fr_1fr_auto_auto]">
              <Input
                value={editingBankName}
                onChange={(e) => setEditingBankName(e.target.value)}
                placeholder="词库名称"
              />
              <Input
                value={editingBankDescription}
                onChange={(e) => setEditingBankDescription(e.target.value)}
                placeholder="词库说明"
              />
              <Button onClick={handleSaveBank} variant="outline">
                <Save className="mr-1 inline h-3.5 w-3.5" />保存词库
              </Button>
              <Button onClick={handleDeleteBank} variant="destructive">
                <Trash2 className="mr-1 inline h-3.5 w-3.5" />删除词库
              </Button>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-[1fr_140px_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    updateWordPage(1, true)
                  }}
                  placeholder="搜索单词"
                  className="pl-9"
                />
              </div>
              <Select
                value={String(difficulty)}
                onValueChange={(v) => {
                  setDifficulty(Number(v))
                  updateWordPage(1, true)
                }}
              >
                <SelectTrigger className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">全部难度</SelectItem>
                  <SelectItem value="1">难度 1</SelectItem>
                  <SelectItem value="2">难度 2</SelectItem>
                  <SelectItem value="3">难度 3</SelectItem>
                  <SelectItem value="4">难度 4</SelectItem>
                  <SelectItem value="5">难度 5</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="outline" className="rounded-md px-3 py-2">
                共 {wordsData?.total ?? 0} 条
              </Badge>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_120px_auto]">
              <Input
                value={wordContent}
                onChange={(e) => setWordContent(e.target.value)}
                placeholder="新单词"
              />
              <Input
                value={wordDefinition}
                onChange={(e) => setWordDefinition(e.target.value)}
                placeholder="释义"
              />
              <Select value={String(wordDifficulty)} onValueChange={(v) => setWordDifficulty(Number(v))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">难度 1</SelectItem>
                  <SelectItem value="2">难度 2</SelectItem>
                  <SelectItem value="3">难度 3</SelectItem>
                  <SelectItem value="4">难度 4</SelectItem>
                  <SelectItem value="5">难度 5</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleCreateWord}
              >
                添加
              </Button>
            </div>

            <div className="space-y-2">
              {wordsData?.list.map((word) => (
                <div
                  key={word.id}
                  className="grid grid-cols-[1fr_2fr_auto] items-center gap-3 rounded-lg border border-slate-200/70 bg-white/60 px-3 py-2 dark:border-slate-800/70 dark:bg-slate-900/60"
                >
                  <div className="flex items-center gap-2">
                    <Type className="h-4 w-4 text-indigo-400" />
                    <span className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                      {word.content}
                    </span>
                  </div>
                  <span className="truncate text-sm text-slate-500 dark:text-slate-400">
                    {word.definition || '暂无释义'}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      onClick={() =>
                        updateWord.mutate({
                          wordId: word.id,
                          content: word.content,
                          definition: word.definition,
                          difficulty: word.difficulty,
                        })
                      }
                      variant="ghost"
                      size="sm"
                    >
                      保存
                    </Button>
                    <Button
                      onClick={() => deleteWord.mutate(word.id)}
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                    >
                      删除
                    </Button>
                  </div>
                </div>
              ))}

              {(wordsData?.list.length ?? 0) === 0 && (
                <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  还没有单词，先添加几条开始练习。
                </div>
              )}
            </div>

            <PaginationControls
              page={wordPage}
              totalPages={totalPages}
              itemLabel={`单词列表，共 ${wordsData?.total ?? 0} 条`}
              onPrev={() => updateWordPage(wordPage - 1)}
              onNext={() => updateWordPage(wordPage + 1)}
            />
          </>
        )}
        </CardContent>
      </Card>
    </div>
  )
}

function SentencePanel() {
  const [selectedBankId, setSelectedBankId] = useState('')
  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState(0)
  const [bankName, setBankName] = useState('')
  const [bankCategory, setBankCategory] = useState('')
  const [editingBankName, setEditingBankName] = useState('')
  const [editingBankCategory, setEditingBankCategory] = useState('')
  const [sentenceContent, setSentenceContent] = useState('')
  const [sentenceTranslation, setSentenceTranslation] = useState('')
  const [sentenceSource, setSentenceSource] = useState('')
  const [sentenceDifficulty, setSentenceDifficulty] = useState(3)

  const { data: banks = [] } = useSentenceBanks()
  const createBank = useCreateSentenceBank()
  const updateBank = useUpdateSentenceBank()
  const deleteBank = useDeleteSentenceBank()

  const { data: sentencesData } = useSentences(selectedBankId, 1, 100, search, difficulty)
  const createSentence = useCreateSentence()
  const updateSentence = useUpdateSentence()
  const deleteSentence = useDeleteSentence()
  const importSentences = useImportSentences()

  const selectedBank = useMemo(
    () => banks.find((b) => b.id === selectedBankId),
    [banks, selectedBankId],
  )

  useEffect(() => {
    if (!selectedBank) {
      setEditingBankName('')
      setEditingBankCategory('')
      return
    }

    setEditingBankName(selectedBank.name)
    setEditingBankCategory(selectedBank.category ?? '')
  }, [selectedBank?.id])

  const handleCreateBank = () => {
    if (!bankName.trim()) return
    createBank.mutate(
      { name: bankName.trim(), category: bankCategory.trim() },
      {
        onSuccess: (bank) => {
          setSelectedBankId(bank.id)
          setBankName('')
          setBankCategory('')
        },
      },
    )
  }

  const handleSaveBank = () => {
    if (!selectedBank || !editingBankName.trim()) return

    updateBank.mutate({
      id: selectedBank.id,
      name: editingBankName.trim(),
      category: editingBankCategory.trim(),
    })
  }

  const handleDeleteBank = () => {
    if (!selectedBank) return
    if (!window.confirm(`确定删除句库「${selectedBank.name}」吗？`)) return

    deleteBank.mutate(selectedBank.id, {
      onSuccess: () => {
        setSelectedBankId('')
        setEditingBankName('')
        setEditingBankCategory('')
      },
    })
  }

  const handleCreateSentence = () => {
    if (!selectedBankId || !sentenceContent.trim()) return
    createSentence.mutate(
      {
        bankId: selectedBankId,
        content: sentenceContent.trim(),
        translation: sentenceTranslation.trim() || undefined,
        source: sentenceSource.trim(),
        difficulty: sentenceDifficulty,
      },
      {
        onSuccess: () => {
          setSentenceContent('')
          setSentenceTranslation('')
          setSentenceSource('')
          setSentenceDifficulty(3)
        },
      },
    )
  }

  const handleImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedBankId) return
    const format = file.name.endsWith('.csv') ? 'csv' : 'json'
    importSentences.mutate({ bankId: selectedBankId, file, format })
    e.target.value = ''
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>句库列表</CardTitle>
        </CardHeader>
        <CardContent>
        <div className="mb-4 space-y-2">
          {banks.map((bank: SentenceBank) => (
            <Button
              key={bank.id}
              onClick={() => setSelectedBankId(bank.id)}
              variant={selectedBankId === bank.id ? 'secondary' : 'ghost'}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors ${
                selectedBankId === bank.id ? 'text-primary' : 'text-foreground'
              }`}
            >
              <span className="truncate text-sm font-medium">{bank.name}</span>
              <span className="text-xs opacity-70">{bank.sentence_count}</span>
            </Button>
          ))}
          {banks.length === 0 && (
            <p className="rounded-lg bg-secondary px-3 py-2 text-xs text-muted-foreground">
              还没有句库，先创建一个。
            </p>
          )}
        </div>

        <div className="space-y-2 border-t border-border pt-4">
          <Input
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="新句库名称"
          />
          <Input
            value={bankCategory}
            onChange={(e) => setBankCategory(e.target.value)}
            placeholder="分类（可选）"
          />
          <Button
            onClick={handleCreateBank}
            className="w-full"
          >
            <Plus className="h-4 w-4" />
            创建句库
          </Button>
        </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">
            {selectedBank ? `${selectedBank.name} · 句子管理` : '请选择句库'}
          </h2>
          {selectedBank && (
            <div className="flex gap-2">
              <Button
                onClick={() =>
                  updateBank.mutate({
                    id: selectedBank.id,
                    name: selectedBank.name,
                    category: selectedBank.category,
                  })
                }
                variant="outline"
                size="sm"
              >
                <Save className="mr-1 inline h-3.5 w-3.5" />保存句库
              </Button>
              <Button
                onClick={() => deleteBank.mutate(selectedBank.id)}
                variant="destructive"
                size="sm"
              >
                <Trash2 className="mr-1 inline h-3.5 w-3.5" />删除句库
              </Button>
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground shadow-sm hover:bg-accent">
                <FileUp className="h-3.5 w-3.5" />导入
                <input type="file" accept=".json,.csv" onChange={handleImport} className="hidden" />
              </label>
            </div>
          )}
        </div>

        {selectedBank && (
          <>
            <div className="mb-4 grid grid-cols-1 gap-2 lg:grid-cols-[1fr_1fr_auto_auto]">
              <Input
                value={editingBankName}
                onChange={(e) => setEditingBankName(e.target.value)}
                placeholder="句库名称"
              />
              <Input
                value={editingBankCategory}
                onChange={(e) => setEditingBankCategory(e.target.value)}
                placeholder="分类"
              />
              <Button onClick={handleSaveBank} variant="outline">
                <Save className="mr-1 inline h-3.5 w-3.5" />保存句库
              </Button>
              <Button onClick={handleDeleteBank} variant="destructive">
                <Trash2 className="mr-1 inline h-3.5 w-3.5" />删除句库
              </Button>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-[1fr_140px_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="搜索句子"
                  className="pl-9"
                />
              </div>
              <Select value={String(difficulty)} onValueChange={(v) => setDifficulty(Number(v))}>
                <SelectTrigger className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">全部难度</SelectItem>
                  <SelectItem value="1">难度 1</SelectItem>
                  <SelectItem value="2">难度 2</SelectItem>
                  <SelectItem value="3">难度 3</SelectItem>
                  <SelectItem value="4">难度 4</SelectItem>
                  <SelectItem value="5">难度 5</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="outline" className="rounded-md px-3 py-2">
                共 {sentencesData?.total ?? 0} 条
              </Badge>
            </div>

            <div className="mb-4 space-y-2">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <Input
                  value={sentenceContent}
                  onChange={(e) => setSentenceContent(e.target.value)}
                  placeholder="新句子内容"
                />
                <Input
                  value={sentenceTranslation}
                  onChange={(e) => setSentenceTranslation(e.target.value)}
                  placeholder="翻译（可选）"
                />
              </div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_120px_auto]">
                <Input
                  value={sentenceSource}
                  onChange={(e) => setSentenceSource(e.target.value)}
                  placeholder="来源（可选）"
                />
                <Select value={String(sentenceDifficulty)} onValueChange={(v) => setSentenceDifficulty(Number(v))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">难度 1</SelectItem>
                    <SelectItem value="2">难度 2</SelectItem>
                    <SelectItem value="3">难度 3</SelectItem>
                    <SelectItem value="4">难度 4</SelectItem>
                    <SelectItem value="5">难度 5</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleCreateSentence}>添加</Button>
              </div>
            </div>

            <div className="space-y-2">
              {sentencesData?.list.map((sentence) => (
                <SentenceRow
                  key={sentence.id}
                  sentence={sentence}
                  onUpdate={(data) =>
                    updateSentence.mutate({ sentenceId: sentence.id, ...data })
                  }
                  onDelete={() => deleteSentence.mutate(sentence.id)}
                />
              ))}

              {(sentencesData?.list.length ?? 0) === 0 && (
                <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  还没有句子，先添加几条开始练习。
                </div>
              )}
            </div>
          </>
        )}
        </CardContent>
      </Card>
    </div>
  )
}

function SentenceRow({
  sentence,
  onUpdate,
  onDelete,
}: {
  sentence: Sentence
  onUpdate: (data: { content: string; translation: string; source: string; difficulty: number }) => void
  onDelete: () => void
}) {
  const [content, setContent] = useState(sentence.content)
  const [translation, setTranslation] = useState(sentence.translation ?? '')
  const [source, setSource] = useState(sentence.source ?? '')
  const [difficulty, setDifficulty] = useState(sentence.difficulty)

  useEffect(() => {
    setContent(sentence.content)
    setTranslation(sentence.translation ?? '')
    setSource(sentence.source ?? '')
    setDifficulty(sentence.difficulty)
  }, [sentence.id, sentence.content, sentence.translation, sentence.source, sentence.difficulty])

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border/70 bg-card/60 p-3">
      <div className="flex items-start gap-2">
        <CaseSensitive className="mt-2 h-4 w-4 shrink-0 text-indigo-400" />
        <div className="flex flex-1 flex-col gap-1.5">
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="句子内容"
            className="text-sm font-medium"
          />
          <Input
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
            placeholder="翻译（可选）"
            className="text-sm text-muted-foreground"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 pl-6">
        <Input
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="来源"
          className="flex-1 text-xs"
        />
        <Select value={String(difficulty)} onValueChange={(v) => setDifficulty(Number(v))}>
          <SelectTrigger className="w-24 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5].map((d) => (
              <SelectItem key={d} value={String(d)}>
                难度 {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={() => onUpdate({ content, translation, source, difficulty })}
          variant="ghost"
          size="sm"
        >
          保存
        </Button>
        <Button
          onClick={onDelete}
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
        >
          删除
        </Button>
      </div>
    </div>
  )
}

// ─── Article Panel ────────────────────────────────────────

function ArticlePanel() {
  const [view, setView] = useState<'banks' | 'articles' | 'detail'>('banks')
  const [selectedBankId, setSelectedBankId] = useState('')
  const [selectedArticleId, setSelectedArticleId] = useState('')

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <button
          onClick={() => { setView('banks'); setSelectedBankId(''); setSelectedArticleId('') }}
          className={view === 'banks' ? 'font-medium text-foreground' : 'hover:text-foreground'}
        >
          全部文章库
        </button>
        {(view === 'articles' || view === 'detail') && (
          <>
            <ChevronRight className="size-3.5" />
            <button
              onClick={() => { setView('articles'); setSelectedArticleId('') }}
              className={view === 'articles' ? 'font-medium text-foreground' : 'hover:text-foreground'}
            >
              文章列表
            </button>
          </>
        )}
        {view === 'detail' && (
          <>
            <ChevronRight className="size-3.5" />
            <span className="font-medium text-foreground">文章详情</span>
          </>
        )}
      </div>

      {view === 'banks' && (
        <ArticleBankList
          onOpenArticles={(id) => { setSelectedBankId(id); setView('articles') }}
        />
      )}
      {view === 'articles' && selectedBankId && (
        <ArticleListView
          bankId={selectedBankId}
          onSelect={(id) => { setSelectedArticleId(id); setView('detail') }}
        />
      )}
      {view === 'detail' && selectedArticleId && (
        <ArticleDetailPanel articleId={selectedArticleId} />
      )}
    </div>
  )
}

function ArticleBankList({ onOpenArticles }: { onOpenArticles: (id: string) => void }) {
  const { data: banks = [] } = useArticleBanks()
  const createBank = useCreateArticleBank()
  const updateBank = useUpdateArticleBank()
  const deleteBank = useDeleteArticleBank()
  const [selectedBankId, setSelectedBankId] = useState('')
  const [createName, setCreateName] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [createLanguage, setCreateLanguage] = useState('en')
  const [editingName, setEditingName] = useState('')
  const [editingDescription, setEditingDescription] = useState('')
  const [editingLanguage, setEditingLanguage] = useState('en')

  const selectedBank = useMemo(
    () => banks.find((bank) => bank.id === selectedBankId),
    [banks, selectedBankId],
  )

  useEffect(() => {
    if (!selectedBank) {
      setEditingName('')
      setEditingDescription('')
      setEditingLanguage('en')
      return
    }

    setEditingName(selectedBank.name)
    setEditingDescription(selectedBank.description ?? '')
    setEditingLanguage(selectedBank.language || 'en')
  }, [selectedBank?.id])

  const handleCreate = () => {
    if (!createName.trim()) return
    createBank.mutate(
      {
        name: createName.trim(),
        description: createDescription.trim(),
        language: createLanguage.trim() || 'en',
      },
      {
        onSuccess: (bank) => {
          setSelectedBankId(bank.id)
          setCreateName('')
          setCreateDescription('')
          setCreateLanguage('en')
          setEditingName(bank.name)
          setEditingDescription(bank.description ?? '')
          setEditingLanguage(bank.language || 'en')
        },
      },
    )
  }

  const handleSave = () => {
    if (!selectedBank || !editingName.trim()) return

    updateBank.mutate({
      id: selectedBank.id,
      name: editingName.trim(),
      description: editingDescription.trim(),
      language: editingLanguage.trim() || 'en',
    })
  }

  const handleDelete = () => {
    if (!selectedBank) return
    if (!window.confirm(`确定删除文章库「${selectedBank.name}」吗？`)) return

    deleteBank.mutate(selectedBank.id, {
      onSuccess: () => {
        setSelectedBankId('')
        setEditingName('')
        setEditingDescription('')
        setEditingLanguage('en')
      },
    })
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>文章库列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 space-y-2">
            {banks.map((bank: ArticleBank) => (
              <Button
                key={bank.id}
                onClick={() => setSelectedBankId(bank.id)}
                variant={selectedBankId === bank.id ? 'secondary' : 'ghost'}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left"
              >
                <span className="truncate text-sm font-medium">{bank.name}</span>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{bank.language}</Badge>
                  <span className="text-xs opacity-70">{bank.article_count} 篇</span>
                </div>
              </Button>
            ))}
            {banks.length === 0 && (
              <p className="rounded-lg bg-secondary px-3 py-2 text-xs text-muted-foreground">
                还没有文章库，先创建一个。
              </p>
            )}
          </div>
          <div className="space-y-2 border-t border-border pt-4">
            <Input value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="新文章库名称" />
            <Input value={createDescription} onChange={(e) => setCreateDescription(e.target.value)} placeholder="文章库说明（可选）" />
            <Input value={createLanguage} onChange={(e) => setCreateLanguage(e.target.value)} placeholder="语言 (en / zh)" />
            <Button onClick={handleCreate} className="w-full" disabled={createBank.isPending}>
              <Plus className="h-4 w-4" />
              创建文章库
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          {selectedBank ? (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">文章库设置</h3>
              <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} placeholder="文章库名称" />
              <Input value={editingDescription} onChange={(e) => setEditingDescription(e.target.value)} placeholder="文章库说明（可选）" />
              <Input value={editingLanguage} onChange={(e) => setEditingLanguage(e.target.value)} placeholder="语言 (en / zh)" />
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSave} variant="outline">
                  <Save className="mr-1 inline h-3.5 w-3.5" />保存文章库
                </Button>
                <Button onClick={handleDelete} variant="destructive">
                  <Trash2 className="mr-1 inline h-3.5 w-3.5" />删除文章库
                </Button>
                <Button onClick={() => onOpenArticles(selectedBank.id)}>
                  <ChevronRight className="mr-1 inline h-3.5 w-3.5" />查看文章
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-40 items-center justify-center text-center text-muted-foreground">
              <div>
                <FileText className="mx-auto mb-3 size-10 opacity-20" />
                <p className="text-sm">选择左侧文章库后可编辑名称、说明和语言</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ArticleListView({
  bankId,
  onSelect,
}: {
  bankId: string
  onSelect: (id: string) => void
}) {
  const { data } = useArticles(bankId, 1, 100)
  const createArticle = useCreateArticle()

  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [content, setContent] = useState('')
  const [difficulty, setDifficulty] = useState('3')

  const articles = data?.list ?? []

  const handleCreate = () => {
    if (!title.trim() || !content.trim()) return
    createArticle.mutate(
      { bankId, title: title.trim(), author: author.trim(), content: content.trim(), difficulty: parseInt(difficulty, 10) },
      {
        onSuccess: () => {
          setTitle(''); setAuthor(''); setContent(''); setShowForm(false)
        },
      },
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>文章列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 space-y-2">
            {articles.map((article: Article) => (
              <Button
                key={article.id}
                onClick={() => onSelect(article.id)}
                variant="ghost"
                className="flex w-full flex-col items-start rounded-lg px-3 py-2 text-left"
              >
                <span className="w-full truncate text-sm font-medium">{article.title}</span>
                <span className="text-xs text-muted-foreground">
                  {article.paragraph_count} 段 · {article.total_char_count} 字符 · 难度 {article.difficulty}
                </span>
              </Button>
            ))}
            {articles.length === 0 && (
              <p className="rounded-lg bg-secondary px-3 py-2 text-xs text-muted-foreground">
                还没有文章，先添加一篇。
              </p>
            )}
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="w-full" variant="outline">
            <Plus className="h-4 w-4" />
            {showForm ? '收起' : '添加文章'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          {showForm ? (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">新建文章（空行自动分段，段内自动分句）</h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Input placeholder="标题 *" value={title} onChange={(e) => setTitle(e.target.value)} />
                <Input placeholder="作者（可选）" value={author} onChange={(e) => setAuthor(e.target.value)} />
              </div>
              <textarea
                className="w-full rounded-lg border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                rows={10}
                placeholder="粘贴文章内容（空行分段）*"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <div className="flex items-center gap-3">
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((d) => (
                      <SelectItem key={d} value={String(d)}>难度 {d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex-1" />
                <Button variant="ghost" onClick={() => setShowForm(false)}>取消</Button>
                <Button onClick={handleCreate} disabled={createArticle.isPending}>创建</Button>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-40 items-center justify-center text-center text-sm text-muted-foreground">
              <div>
                <FileText className="mx-auto mb-3 size-8 opacity-20" />
                <p>选择左侧文章查看详情，或点击"添加文章"</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ArticleDetailPanel({ articleId }: { articleId: string }) {
  const { data: detail } = useArticleDetail(articleId)
  const { data: sentences = [] } = useArticleSentences(articleId)
  const updateSentence = useUpdateArticleSentence()
  const resetProgress = useResetProgress()
  const deleteArticle = useDeleteArticle()

  const groupedSentences = useMemo(() => {
    const group = new Map<string, ArticleSentence[]>()
    for (const s of sentences) {
      if (!group.has(s.paragraph_id)) group.set(s.paragraph_id, [])
      group.get(s.paragraph_id)!.push(s)
    }
    return group
  }, [sentences])

  if (!detail) return <div className="py-8 text-center text-sm text-muted-foreground">加载中...</div>

  const progress = detail.progress
  const progressPercent = progress && progress.total_paragraphs > 0
    ? (progress.completed_paragraphs / progress.total_paragraphs) * 100
    : 0

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>{detail.title}</CardTitle>
              {detail.author && (
                <p className="mt-1 text-sm text-muted-foreground">作者：{detail.author}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteArticle.mutate(articleId)}
              className="shrink-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <Badge variant="outline">难度 {detail.difficulty}</Badge>
            <span>{detail.paragraph_count} 段</span>
            <span>{detail.total_char_count} 字符</span>
          </div>
          {progress && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  练习进度 {progress.completed_paragraphs} / {progress.total_paragraphs} 段
                </span>
                <span className="font-medium">{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-1.5" />
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => resetProgress.mutate(articleId)}>
                重置进度
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">段落与句子释义</CardTitle>
          <p className="text-xs text-muted-foreground">为每个句子填写释义，练习时将在打字区下方显示</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {detail.paragraphs.map((p) => {
            const ss = groupedSentences.get(p.id) ?? []
            return (
              <div key={p.id} className="rounded-lg border border-border/60 p-3">
                <div className="mb-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="text-[10px]">段落 {p.paragraph_index + 1}</Badge>
                  <span>{p.char_count} 字符</span>
                  <span>{p.sentence_count} 句</span>
                </div>
                <p className="mb-3 rounded bg-secondary/30 p-2 text-sm leading-relaxed text-foreground">
                  {p.content}
                </p>
                <div className="space-y-2">
                  {ss.map((s) => (
                    <ArticleSentenceRow
                      key={s.id}
                      sentence={s}
                      onUpdate={(translation) =>
                        updateSentence.mutate({ sentenceId: s.id, translation })
                      }
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <ArticleProgressSection />
    </div>
  )
}

function ArticleSentenceRow({
  sentence,
  onUpdate,
}: {
  sentence: ArticleSentence
  onUpdate: (translation: string) => void
}) {
  const [translation, setTranslation] = useState(sentence.translation ?? '')

  useEffect(() => {
    setTranslation(sentence.translation ?? '')
  }, [sentence.id, sentence.translation])

  return (
    <div className="rounded border border-border/50 bg-secondary/10 p-2">
      <p className="mb-1.5 text-sm text-foreground">{sentence.content}</p>
      <div className="flex items-center gap-2">
        <Input
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          placeholder="填写句子释义（可选）"
          className="text-xs"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => onUpdate(translation)}
          className="shrink-0"
        >
          <Save className="size-3" />
          保存
        </Button>
      </div>
    </div>
  )
}

function ArticleProgressSection() {
  const { data: progress = [] } = useArticleProgress()

  if (progress.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">全部阅读进度</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {progress.map((item: ProgressItem) => {
          const percent = item.total_paragraphs > 0
            ? (item.completed_paragraphs / item.total_paragraphs) * 100
            : 0
          return (
            <div key={item.id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{item.article_title}</span>
                <span className="text-muted-foreground">{item.completed_paragraphs}/{item.total_paragraphs}</span>
              </div>
              <Progress value={percent} className="h-1.5" />
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
