import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Main } from "@/components/layouts/Main";
import { PageHeader } from "@/components/PageHeader";
import {
  Settings,
  LogOut,
  Info,
  Copy,
  Plus,
  Edit,
  Lock,
  Camera,
  MoreVertical,
  Loader2,
} from "lucide-react";
import dayjs from "dayjs";
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
  getApiTokens,
  createApiToken,
  deleteApiToken,
  uploadAvatar,
  type UserProfile,
  type ApiToken,
  type CreateTokenRequest,
} from "@/api/profile";
import { compressImageToBase64, validateImageFile } from "@/utils/image-compression";

// shadcn/ui imports
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";

const columnHelper = createColumnHelper<ApiToken>();

export default function ProfileSettings() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal 状态
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [createTokenModalOpen, setCreateTokenModalOpen] = useState(false);

  // 表单状态
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    bio: ""
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [tokenForm, setTokenForm] = useState({
    name: "",
    expiresAt: ""
  });

  // 新建 Token 成功后保存 accessToken
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  // 查询用户信息
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: getUserProfile,
  });

  // 查询 API Tokens
  const { data: tokensData, isLoading: tokensLoading } = useQuery({
    queryKey: ['apiTokens'],
    queryFn: getApiTokens,
  });

  // 当用户信息加载完成后，更新表单
  useEffect(() => {
    if (userProfile) {
      setEditForm({
        username: userProfile.username || "",
        email: userProfile.email || "",
        bio: userProfile.bio || ""
      });
    }
  }, [userProfile]);

  // 更新用户信息
  const updateProfileMutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      setEditModalOpen(false);
    },
  });

  // 上传头像
  const uploadAvatarMutation = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });

  // 修改密码
  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setPasswordModalOpen(false);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
  });

  // 创建 Token
  const createTokenMutation = useMutation({
    mutationFn: createApiToken,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['apiTokens'] });
      setTokenForm({ name: '', expiresAt: '' });
      setCreatedToken(data.accessToken); // 保存 accessToken
    },
  });

  // 删除 Token
  const deleteTokenMutation = useMutation({
    mutationFn: deleteApiToken,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiTokens'] });
    },
  });

  // 处理表单提交
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(editForm);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("新密码和确认密码不匹配");
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  const handleCreateToken = (e: React.FormEvent) => {
    e.preventDefault();
    const data: CreateTokenRequest = {
      name: tokenForm.name,
      expiresAt: tokenForm.expiresAt || undefined,
    };
    createTokenMutation.mutate(data);
  };

  // 处理头像上传
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件
    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    try {
      // 压缩图片并转换为 base64
      const base64Data = await compressImageToBase64(file, {
        maxWidth: 200,
        maxHeight: 200,
        quality: 0.8,
        maxSize: 1024 * 1024, // 1MB
      });

      // 上传到服务器
      uploadAvatarMutation.mutate({ avatar: base64Data });
    } catch (error) {
      console.error('头像上传失败:', error);
      alert('头像上传失败，请重试');
    }

    // 清空 input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 复制 Token
  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    // 这里可以添加一个 toast 提示
  };

  // 删除 Token
  const handleDeleteToken = (id: string) => {
    if (confirm("确定要删除这个 Token 吗?删除后无法恢复。")) {
      deleteTokenMutation.mutate(id);
    }
  };

  const columns = useMemo(() => [
    columnHelper.accessor('name', {
      header: '名称',
      cell: info => <span className="text-sm">{info.getValue() || 'Session'}</span>,
    }),
    columnHelper.accessor('createdAt', {
      header: '创建时间',
      cell: info => <span className="text-sm">{dayjs(info.getValue()).format('YYYY/MM/DD HH:mm:ss')}</span>,
    }),
    columnHelper.accessor('expiresAt', {
      header: '过期时间',
      cell: info => (
        <span className="text-sm">
          {info.getValue() ? dayjs(info.getValue()).format('YYYY/MM/DD HH:mm:ss') : '永不过期'}
        </span>
      ),
    }),
    columnHelper.accessor('lastUsedAt', {
      header: '最后使用',
      cell: info => (
        <span className="text-sm">
          {info.getValue() ? dayjs(info.getValue()).format('YYYY/MM/DD HH:mm:ss') : '从未使用'}
        </span>
      ),
    }),
    columnHelper.accessor('isExpired', {
      header: '状态',
      cell: info => (
        <Badge variant={info.getValue() ? "destructive" : "default"}>
          {info.getValue() ? "已过期" : "有效"}
        </Badge>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: '操作',
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          onClick={() => handleDeleteToken(row.original.id)}
          disabled={deleteTokenMutation.isPending}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      ),
    }),
  ], [deleteTokenMutation.isPending]);

  const table = useReactTable({
    data: tokensData?.items ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (profileLoading) {
    return (
      <Main>
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Main>
    );
  }

  return (
    <Main>
      <PageHeader
        title="设置"
        description="管理您的个人资料、密码和访问令牌。"
      />

      {/* 账户信息卡片 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={userProfile?.image || "https://avatars.githubusercontent.com/u/45908451"} />
              <AvatarFallback>{userProfile?.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-bold">
                {userProfile?.username}{' '}
                <span className="text-sm font-normal text-muted-foreground">
                  ({userProfile?.email})
                </span>
              </h2>
              {userProfile?.bio && (
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  {userProfile.bio}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditModalOpen(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  编辑
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPasswordModalOpen(true)}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  修改密码
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Access Token 表格 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Access Tokens</CardTitle>
              <CardDescription>
                A list of all access tokens for your account.
              </CardDescription>
            </div>
            <Button onClick={() => setCreateTokenModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              创建
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {tokensLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tokensData?.items.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              暂无 Token,请点击右上角"创建"按钮
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map(headerGroup => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 编辑信息 Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>编辑个人信息</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="space-y-4 py-4">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={userProfile?.image || "https://avatars.githubusercontent.com/u/45908451"} />
                    <AvatarFallback>{userProfile?.username?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full border-2 border-background"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadAvatarMutation.isPending}
                  >
                    {uploadAvatarMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <Input
                  id="username"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">个人简介</Label>
                <Textarea
                  id="bio"
                  rows={3}
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="介绍一下自己..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditModalOpen(false)}
                disabled={updateProfileMutation.isPending}
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                保存
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 修改密码 Modal */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>修改密码</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePasswordSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">当前密码</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">新密码</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">确认新密码</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPasswordModalOpen(false)}
                disabled={changePasswordMutation.isPending}
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                修改密码
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 创建 Token Modal */}
      <Dialog open={createTokenModalOpen} onOpenChange={(open) => {
        setCreateTokenModalOpen(open);
        if (!open) setCreatedToken(null);
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>创建 API Token</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {createdToken ? (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <p className="mb-2">只会展示一次,请复制保存:</p>
                  <div className="flex gap-2">
                    <Input
                      value={createdToken}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(createdToken)}
                    >
                      复制
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    API Token 将用于第三方应用程序访问您的账户。请妥善保管,不要泄露给他人。
                  </AlertDescription>
                </Alert>
                <form onSubmit={handleCreateToken}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="token-name">Token 名称</Label>
                      <Input
                        id="token-name"
                        placeholder="例如:GitHub Integration"
                        value={tokenForm.name}
                        onChange={(e) => setTokenForm({ ...tokenForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expires-at">过期时间</Label>
                      <Input
                        id="expires-at"
                        type="datetime-local"
                        value={tokenForm.expiresAt}
                        onChange={(e) => setTokenForm({ ...tokenForm, expiresAt: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        留空表示永不过期
                      </p>
                    </div>
                  </div>
                  <DialogFooter className="mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCreateTokenModalOpen(false)}
                      disabled={createTokenMutation.isPending}
                    >
                      取消
                    </Button>
                    <Button
                      type="submit"
                      disabled={createTokenMutation.isPending}
                    >
                      {createTokenMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      创建 Token
                    </Button>
                  </DialogFooter>
                </form>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Main>
  );
}