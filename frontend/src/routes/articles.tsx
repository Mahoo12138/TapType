import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { BookOpen, ChevronRight, FileText, Plus, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  useArticleBanks,
  useCreateArticleBank,
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
import type { ArticleBank, ArticleSentence } from '@/types/api'

export const Route = createFileRoute('/articles')({
  component: Articles,
})

function Articles() {
  const [view, setView] = useState<'banks' | 'articles' | 'detail'>('banks')
  const [selectedBankId, setSelectedBankId] = useState('')
  const [selectedArticleId, setSelectedArticleId] = useState('')

  return (
    <div className="mx-auto max-w-7xl p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">文章库</h1>
        <p className="text-sm text-muted-foreground">段落级练习 + 段内句子释义管理</p>
      </div>

      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <button
          onClick={() => {
            setView('banks')
            setSelectedBankId('')
            setSelectedArticleId('')
          }}
          className="hover:text-foreground"
        >
          文章库
        </button>
        {(view === 'articles' || view === 'detail') && selectedBankId && (
          <>
            <ChevronRight className="size-4" />
            <button
              onClick={() => {
                setView('articles')
                setSelectedArticleId('')
              }}
              className="hover:text-foreground"
            >
              文章列表
            </button>
          </>
        )}
        {view === 'detail' && selectedArticleId && (
          <>
            <ChevronRight className="size-4" />
            <span className="text-foreground">文章详情</span>
          </>
        )}
      </div>

      {view === 'banks' && <BankList onSelect={(id) => { setSelectedBankId(id); setView('articles') }} />}
      {view === 'articles' && selectedBankId && (
        <ArticleList bankId={selectedBankId} onSelect={(id) => { setSelectedArticleId(id); setView('detail') }} />
      )}
      {view === 'detail' && selectedArticleId && <ArticleDetailView articleId={selectedArticleId} />}

      <div className="mt-10">
        <ProgressList />
      </div>
    </div>
  )
}

function BankList({ onSelect }: { onSelect: (id: string) => void }) {
  const { data: banks = [] } = useArticleBanks()
  const createBank = useCreateArticleBank()
  const deleteBank = useDeleteArticleBank()
  const [name, setName] = useState('')
  const [lang, setLang] = useState('en')

  const handleCreate = () => {
    if (!name.trim()) return
    createBank.mutate({ name: name.trim(), language: lang }, { onSuccess: () => setName('') })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">新建文章库</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Input placeholder="文章库名称" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <Input className="w-28" value={lang} onChange={(e) => setLang(e.target.value)} placeholder="语言" />
            <Button onClick={handleCreate} disabled={createBank.isPending}>
              <Plus className="size-4" /> 新建
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {banks.map((bank: ArticleBank) => (
          <Card key={bank.id} className="cursor-pointer transition-colors hover:bg-secondary/30" onClick={() => onSelect(bank.id)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <BookOpen className="size-4 text-primary" />
                <CardTitle className="text-base">{bank.name}</CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteBank.mutate(bank.id) }}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Badge variant="outline">{bank.language}</Badge>
                <span>{bank.article_count} 篇文章</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {banks.length === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          <FileText className="mx-auto mb-3 size-10 opacity-30" />
          <p>还没有文章库，创建一个开始吧</p>
        </div>
      )}
    </div>
  )
}

function ArticleList({ bankId, onSelect }: { bankId: string; onSelect: (id: string) => void }) {
  const { data } = useArticles(bankId, 1, 100)
  const createArticle = useCreateArticle()
  const deleteArticle = useDeleteArticle()

  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [content, setContent] = useState('')
  const [difficulty, setDifficulty] = useState('1')

  const handleCreate = () => {
    if (!title.trim() || !content.trim()) return
    createArticle.mutate(
      {
        bankId,
        title: title.trim(),
        author: author.trim(),
        content: content.trim(),
        difficulty: parseInt(difficulty, 10),
      },
      {
        onSuccess: () => {
          setTitle('')
          setAuthor('')
          setContent('')
          setShowForm(false)
        },
      },
    )
  }

  const articles = data?.list ?? []
  const total = data?.total ?? 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">共 {total} 篇文章</p>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="size-4" /> 添加文章
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">添加文章（自动按自然段分段 + 段内分句）</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input placeholder="标题 *" value={title} onChange={(e) => setTitle(e.target.value)} />
              <Input placeholder="作者" value={author} onChange={(e) => setAuthor(e.target.value)} />
            </div>
            <textarea
              className="w-full rounded-lg border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              rows={8}
              placeholder="粘贴文章内容（空行分段）*"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="flex items-end gap-3">
              <Input className="w-28" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} placeholder="难度1-5" />
              <div className="flex-1" />
              <Button variant="ghost" onClick={() => setShowForm(false)}>取消</Button>
              <Button onClick={handleCreate} disabled={createArticle.isPending}>创建</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {articles.map((article) => (
          <Card key={article.id} className="cursor-pointer transition-colors hover:bg-secondary/30" onClick={() => onSelect(article.id)}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{article.title}</p>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  {article.author && <span>{article.author}</span>}
                  <span>{article.paragraph_count} 段</span>
                  <span>{article.total_char_count} 字符</span>
                  <Badge variant="outline" className="text-[10px]">难度 {article.difficulty}</Badge>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteArticle.mutate(article.id) }}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function ArticleDetailView({ articleId }: { articleId: string }) {
  const { data: detail } = useArticleDetail(articleId)
  const { data: sentences = [] } = useArticleSentences(articleId)
  const updateSentence = useUpdateArticleSentence()
  const resetProgress = useResetProgress()
  const [editing, setEditing] = useState<Record<string, string>>({})

  const groupedSentences = useMemo(() => {
    const group = new Map<string, ArticleSentence[]>()
    for (const s of sentences) {
      if (!group.has(s.paragraph_id)) group.set(s.paragraph_id, [])
      group.get(s.paragraph_id)!.push(s)
    }
    return group
  }, [sentences])

  if (!detail) return <div className="py-8 text-center text-muted-foreground">加载中...</div>

  const progress = detail.progress
  const progressPercent = progress ? (progress.completed_paragraphs / progress.total_paragraphs) * 100 : 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{detail.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {detail.author && <span>作者: {detail.author}</span>}
            <Badge variant="outline">难度 {detail.difficulty}</Badge>
            <span>{detail.paragraph_count} 段</span>
            <span>{detail.total_char_count} 字符</span>
          </div>

          {progress && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>进度: {progress.completed_paragraphs} / {progress.total_paragraphs}</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              <Button variant="ghost" size="sm" onClick={() => resetProgress.mutate(articleId)}>重置进度</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">段落与句子释义</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {detail.paragraphs.map((p) => {
            const ss = groupedSentences.get(p.id) ?? []
            return (
              <div key={p.id} className="rounded-lg border p-3">
                <div className="mb-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>段落 {p.paragraph_index + 1}</span>
                  <span>{p.char_count} 字符</span>
                  <span>{p.sentence_count} 句</span>
                </div>
                <p className="mb-3 text-sm leading-relaxed">{p.content}</p>
                <div className="space-y-2">
                  {ss.map((s) => (
                    <div key={s.id} className="rounded border bg-secondary/15 p-2">
                      <p className="text-sm">{s.content}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Input
                          placeholder="填写句子释义"
                          value={editing[s.id] ?? s.translation ?? ''}
                          onChange={(e) => setEditing((prev) => ({ ...prev, [s.id]: e.target.value }))}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateSentence.mutate({ sentenceId: s.id, translation: editing[s.id] ?? '' })}
                        >
                          <Save className="size-3" /> 保存
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

function ProgressList() {
  const { data: progress = [] } = useArticleProgress()

  if (progress.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">阅读进度</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {progress.map((item) => {
          const percent = (item.completed_paragraphs / item.total_paragraphs) * 100
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
