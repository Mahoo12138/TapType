import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState, type ChangeEvent } from 'react'
import {
  BookOpen,
  CaseSensitive,
  FileUp,
  Plus,
  Save,
  Search,
  Trash2,
  Type,
} from 'lucide-react'
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
import type { SentenceBank, WordBank } from '@/types/api'

export const Route = createFileRoute('/content')({
  component: Content,
})

function Content() {
  const [tab, setTab] = useState<'word' | 'sentence'>('word')

  return (
    <div className="mx-auto max-w-7xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            内容管理
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            管理你的词库与句库，支持增删改查和批量导入。
          </p>
        </div>
        <BookOpen className="h-7 w-7 text-indigo-500 dark:text-indigo-400" />
      </div>

      <div className="mb-6 inline-flex rounded-xl border border-slate-200/70 bg-white p-1 dark:border-slate-800/70 dark:bg-slate-900">
        <button
          onClick={() => setTab('word')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'word'
              ? 'bg-indigo-600 text-white dark:bg-indigo-500'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          词库管理
        </button>
        <button
          onClick={() => setTab('sentence')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'sentence'
              ? 'bg-indigo-600 text-white dark:bg-indigo-500'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          句库管理
        </button>
      </div>

      {tab === 'word' ? <WordPanel /> : <SentencePanel />}
    </div>
  )
}

function WordPanel() {
  const [selectedBankId, setSelectedBankId] = useState('')
  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState(0)
  const [bankName, setBankName] = useState('')
  const [bankDesc, setBankDesc] = useState('')
  const [wordContent, setWordContent] = useState('')
  const [wordDefinition, setWordDefinition] = useState('')
  const [wordDifficulty, setWordDifficulty] = useState(3)

  const { data: banks = [] } = useWordBanks()
  const createBank = useCreateWordBank()
  const updateBank = useUpdateWordBank()
  const deleteBank = useDeleteWordBank()

  const { data: wordsData } = useWords(selectedBankId, 1, 100, search, difficulty)
  const createWord = useCreateWord()
  const updateWord = useUpdateWord()
  const deleteWord = useDeleteWord()
  const importWords = useImportWords()

  const selectedBank = useMemo(
    () => banks.find((b) => b.id === selectedBankId),
    [banks, selectedBankId],
  )

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
      <section className="rounded-xl border border-slate-200/70 bg-white/80 p-4 backdrop-blur-sm dark:border-slate-800/70 dark:bg-slate-900/80">
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">词库列表</h2>
        <div className="mb-4 space-y-2">
          {banks.map((bank: WordBank) => (
            <button
              key={bank.id}
              onClick={() => setSelectedBankId(bank.id)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors ${
                selectedBankId === bank.id
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <span className="truncate text-sm font-medium">{bank.name}</span>
              <span className="text-xs opacity-70">{bank.word_count}</span>
            </button>
          ))}
          {banks.length === 0 && (
            <p className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              还没有词库，先创建一个。
            </p>
          )}
        </div>

        <div className="space-y-2 border-t border-slate-200 pt-4 dark:border-slate-800">
          <input
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="新词库名称"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <input
            value={bankDesc}
            onChange={(e) => setBankDesc(e.target.value)}
            placeholder="词库描述（可选）"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <button
            onClick={handleCreateBank}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            <Plus className="h-4 w-4" />
            创建词库
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200/70 bg-white/80 p-5 backdrop-blur-sm dark:border-slate-800/70 dark:bg-slate-900/80">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {selectedBank ? `${selectedBank.name} · 单词管理` : '请选择词库'}
          </h2>
          {selectedBank && (
            <div className="flex gap-2">
              <button
                onClick={() =>
                  updateBank.mutate({
                    id: selectedBank.id,
                    name: selectedBank.name,
                    description: selectedBank.description,
                  })
                }
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Save className="mr-1 inline h-3.5 w-3.5" />保存词库
              </button>
              <button
                onClick={() => deleteBank.mutate(selectedBank.id)}
                className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-400 dark:hover:bg-rose-950/40"
              >
                <Trash2 className="mr-1 inline h-3.5 w-3.5" />删除词库
              </button>
              <label className="cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                <FileUp className="mr-1 inline h-3.5 w-3.5" />导入
                <input type="file" accept=".json,.csv" onChange={handleImport} className="hidden" />
              </label>
            </div>
          )}
        </div>

        {selectedBank && (
          <>
            <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-[1fr_140px_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="搜索单词"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none ring-indigo-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value={0}>全部难度</option>
                <option value={1}>难度 1</option>
                <option value={2}>难度 2</option>
                <option value={3}>难度 3</option>
                <option value={4}>难度 4</option>
                <option value={5}>难度 5</option>
              </select>
              <span className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                共 {wordsData?.total ?? 0} 条
              </span>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_120px_auto]">
              <input
                value={wordContent}
                onChange={(e) => setWordContent(e.target.value)}
                placeholder="新单词"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <input
                value={wordDefinition}
                onChange={(e) => setWordDefinition(e.target.value)}
                placeholder="释义"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <select
                value={wordDifficulty}
                onChange={(e) => setWordDifficulty(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value={1}>难度 1</option>
                <option value={2}>难度 2</option>
                <option value={3}>难度 3</option>
                <option value={4}>难度 4</option>
                <option value={5}>难度 5</option>
              </select>
              <button
                onClick={handleCreateWord}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                添加
              </button>
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
                    <button
                      onClick={() =>
                        updateWord.mutate({
                          wordId: word.id,
                          content: word.content,
                          definition: word.definition,
                          difficulty: word.difficulty,
                        })
                      }
                      className="rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => deleteWord.mutate(word.id)}
                      className="rounded-md px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}

              {(wordsData?.list.length ?? 0) === 0 && (
                <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  还没有单词，先添加几条开始练习。
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  )
}

function SentencePanel() {
  const [selectedBankId, setSelectedBankId] = useState('')
  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState(0)
  const [bankName, setBankName] = useState('')
  const [bankCategory, setBankCategory] = useState('')
  const [sentenceContent, setSentenceContent] = useState('')
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

  const handleCreateSentence = () => {
    if (!selectedBankId || !sentenceContent.trim()) return
    createSentence.mutate(
      {
        bankId: selectedBankId,
        content: sentenceContent.trim(),
        source: sentenceSource.trim(),
        difficulty: sentenceDifficulty,
      },
      {
        onSuccess: () => {
          setSentenceContent('')
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
      <section className="rounded-xl border border-slate-200/70 bg-white/80 p-4 backdrop-blur-sm dark:border-slate-800/70 dark:bg-slate-900/80">
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">句库列表</h2>
        <div className="mb-4 space-y-2">
          {banks.map((bank: SentenceBank) => (
            <button
              key={bank.id}
              onClick={() => setSelectedBankId(bank.id)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors ${
                selectedBankId === bank.id
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <span className="truncate text-sm font-medium">{bank.name}</span>
              <span className="text-xs opacity-70">{bank.sentence_count}</span>
            </button>
          ))}
          {banks.length === 0 && (
            <p className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              还没有句库，先创建一个。
            </p>
          )}
        </div>

        <div className="space-y-2 border-t border-slate-200 pt-4 dark:border-slate-800">
          <input
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="新句库名称"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <input
            value={bankCategory}
            onChange={(e) => setBankCategory(e.target.value)}
            placeholder="分类（可选）"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <button
            onClick={handleCreateBank}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            <Plus className="h-4 w-4" />
            创建句库
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200/70 bg-white/80 p-5 backdrop-blur-sm dark:border-slate-800/70 dark:bg-slate-900/80">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {selectedBank ? `${selectedBank.name} · 句子管理` : '请选择句库'}
          </h2>
          {selectedBank && (
            <div className="flex gap-2">
              <button
                onClick={() =>
                  updateBank.mutate({
                    id: selectedBank.id,
                    name: selectedBank.name,
                    category: selectedBank.category,
                  })
                }
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Save className="mr-1 inline h-3.5 w-3.5" />保存句库
              </button>
              <button
                onClick={() => deleteBank.mutate(selectedBank.id)}
                className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-400 dark:hover:bg-rose-950/40"
              >
                <Trash2 className="mr-1 inline h-3.5 w-3.5" />删除句库
              </button>
              <label className="cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                <FileUp className="mr-1 inline h-3.5 w-3.5" />导入
                <input type="file" accept=".json,.csv" onChange={handleImport} className="hidden" />
              </label>
            </div>
          )}
        </div>

        {selectedBank && (
          <>
            <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-[1fr_140px_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="搜索句子"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none ring-indigo-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value={0}>全部难度</option>
                <option value={1}>难度 1</option>
                <option value={2}>难度 2</option>
                <option value={3}>难度 3</option>
                <option value={4}>难度 4</option>
                <option value={5}>难度 5</option>
              </select>
              <span className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                共 {sentencesData?.total ?? 0} 条
              </span>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-[2fr_1fr_120px_auto]">
              <input
                value={sentenceContent}
                onChange={(e) => setSentenceContent(e.target.value)}
                placeholder="新句子"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <input
                value={sentenceSource}
                onChange={(e) => setSentenceSource(e.target.value)}
                placeholder="来源（可选）"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <select
                value={sentenceDifficulty}
                onChange={(e) => setSentenceDifficulty(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value={1}>难度 1</option>
                <option value={2}>难度 2</option>
                <option value={3}>难度 3</option>
                <option value={4}>难度 4</option>
                <option value={5}>难度 5</option>
              </select>
              <button
                onClick={handleCreateSentence}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                添加
              </button>
            </div>

            <div className="space-y-2">
              {sentencesData?.list.map((sentence) => (
                <div
                  key={sentence.id}
                  className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-lg border border-slate-200/70 bg-white/60 px-3 py-2 dark:border-slate-800/70 dark:bg-slate-900/60"
                >
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <CaseSensitive className="h-4 w-4 text-indigo-400" />
                      <span className="line-clamp-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                        {sentence.content}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      来源：{sentence.source || '未知'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        updateSentence.mutate({
                          sentenceId: sentence.id,
                          content: sentence.content,
                          source: sentence.source,
                          difficulty: sentence.difficulty,
                        })
                      }
                      className="rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => deleteSentence.mutate(sentence.id)}
                      className="rounded-md px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}

              {(sentencesData?.list.length ?? 0) === 0 && (
                <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  还没有句子，先添加几条开始练习。
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  )
}
