# 分支管理說明

## 分支結構

本專案採用 Git Flow 工作流程，使用以下分支結構：

### 主要分支

- **`master`** - 生產環境分支（穩定版本）
  - 用於正式發布的代碼
  - 所有發布版本都從這個分支打 tag
  - 只能從 `develop` 或 `hotfix` 分支合併
  - ⚠️ 受保護分支，需要 Pull Request 審核

- **`develop`** - 開發分支（最新開發版本）
  - 日常開發的主要分支
  - 包含下一個版本的最新功能
  - 功能開發完成後合併到此分支
  - 定期合併到 `master` 進行發布

### 輔助分支

- **`feature/*`** - 功能分支
  - 從 `develop` 分支創建
  - 開發完成後合併回 `develop`
  - 命名規則：`feature/功能名稱`
  - 例如：`feature/user-authentication`

- **`hotfix/*`** - 緊急修復分支
  - 從 `master` 分支創建
  - 修復完成後合併回 `master` 和 `develop`
  - 命名規則：`hotfix/問題描述`
  - 例如：`hotfix/login-bug`

- **`release/*`** - 發布分支
  - 從 `develop` 分支創建
  - 用於準備新版本發布
  - 完成後合併到 `master` 和 `develop`
  - 命名規則：`release/版本號`
  - 例如：`release/v1.0.0`

## 工作流程

### 1. 開發新功能

```bash
# 切換到 develop 分支並更新
git checkout develop
git pull origin develop

# 創建功能分支
git checkout -b feature/new-feature

# 開發並提交
git add .
git commit -m "feat: 添加新功能"

# 推送到遠端
git push origin feature/new-feature

# 在 GitHub 上創建 Pull Request 到 develop 分支
```

### 2. 發布新版本

```bash
# 從 develop 創建發布分支
git checkout develop
git pull origin develop
git checkout -b release/v1.0.0

# 更新版本號、CHANGELOG 等
git commit -m "chore: bump version to 1.0.0"

# 合併到 master
git checkout master
git merge release/v1.0.0
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin master --tags

# 合併回 develop
git checkout develop
git merge release/v1.0.0
git push origin develop

# 刪除發布分支
git branch -d release/v1.0.0
```

### 3. 緊急修復

```bash
# 從 master 創建 hotfix 分支
git checkout master
git pull origin master
git checkout -b hotfix/critical-bug

# 修復並提交
git commit -m "fix: 修復緊急問題"

# 合併到 master
git checkout master
git merge hotfix/critical-bug
git tag -a v1.0.1 -m "Hotfix version 1.0.1"
git push origin master --tags

# 合併到 develop
git checkout develop
git merge hotfix/critical-bug
git push origin develop

# 刪除 hotfix 分支
git branch -d hotfix/critical-bug
```

## 分支保護規則

建議在 GitHub 上設置以下保護規則：

### master 分支
- ✅ 要求 Pull Request 才能合併
- ✅ 要求至少 1 個審核者批准
- ✅ 要求狀態檢查通過（CI/CD）
- ✅ 禁止直接推送
- ✅ 要求分支最新才能合併

### develop 分支
- ✅ 要求 Pull Request 才能合併
- ✅ 要求狀態檢查通過（CI/CD）
- ⚠️ 允許管理員直接推送（可選）

## 提交信息規範

使用 Conventional Commits 規範：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 類型
- `feat`: 新功能
- `fix`: Bug 修復
- `docs`: 文檔更新
- `style`: 代碼格式（不影響功能）
- `refactor`: 重構
- `test`: 測試相關
- `chore`: 構建過程或輔助工具的變動
- `perf`: 性能優化

### 示例
```bash
feat(auth): 添加 JWT 認證功能

- 實現 JWT token 生成
- 添加 token 驗證中間件
- 更新登入 API

Closes #123
```

## GitHub 設置步驟

### 1. 更改默認分支
1. 進入 GitHub 倉庫
2. 點擊 **Settings** > **Branches**
3. 在 **Default branch** 部分，點擊切換圖標
4. 選擇 `master` 作為默認分支
5. 點擊 **Update** 確認

### 2. 刪除舊的 main 分支（可選）
1. 確保 `master` 已設為默認分支
2. 在倉庫頁面點擊 **branches**
3. 找到 `main` 分支，點擊刪除圖標
4. 或使用命令：`git push origin --delete main`

### 3. 設置分支保護規則
1. 進入 **Settings** > **Branches**
2. 點擊 **Add rule** 添加保護規則
3. 在 **Branch name pattern** 輸入 `master`
4. 勾選需要的保護選項
5. 重複步驟為 `develop` 分支設置規則

## 當前分支狀態

```bash
# 查看所有分支
git branch -a

# 查看當前分支
git branch

# 查看遠端分支
git remote show origin
```

## 常用命令

```bash
# 更新本地分支列表
git fetch --prune

# 切換分支
git checkout <branch-name>

# 創建並切換分支
git checkout -b <new-branch>

# 刪除本地分支
git branch -d <branch-name>

# 刪除遠端分支
git push origin --delete <branch-name>

# 查看分支歷史
git log --oneline --graph --all
```

---

📚 參考資料：
- [Git Flow 工作流](https://nvie.com/posts/a-successful-git-branching-model/)
- [Conventional Commits](https://www.conventionalcommits.org/)
