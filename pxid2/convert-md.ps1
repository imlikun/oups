# 简单的 Markdown 转 HTML 函数
function Convert-MarkdownToHtml {
    param([string]$md)
    if ([string]::IsNullOrWhiteSpace($md)) { return '' }
    
    $lines = $md -split "`n"
    $html = @()
    $inList = $false
    $inTable = $false
    $tableRows = @()
    
    function Close-List {
        if ($script:inList) { $script:html += '</ul>'; $script:inList = $false }
    }
    
    function Close-Table {
        if ($script:inTable) {
            if ($script:tableRows.Count -gt 1) {
                $script:html += '<table>'
                $script:html += '<thead><tr>' + $script:tableRows[0] + '</tr></thead>'
                $script:html += '<tbody>'
                for ($r = 1; $r -lt $script:tableRows.Count; $r++) {
                    $script:html += '<tr>' + $script:tableRows[$r] + '</tr>'
                }
                $script:html += '</tbody></table>'
            }
            $script:inTable = $false
            $script:tableRows = @()
        }
    }
    
    function Convert-Inline {
        param([string]$s)
        $s = $s -replace '\*\*([^\*]+)\*\*', '<strong>$1</strong>'
        $s = $s -replace '\[([^\]]+)\]\(([^)]+)\)', '<a href="$2" target="_blank">$1</a>'
        return $s
    }
    
    function Parse-Row {
        param([string]$line)
        $cells = $line.Split('|') | Where-Object { $_.Trim() -ne '' }
        return ($cells | ForEach-Object { '<td>' + (Convert-Inline $_.Trim()) + '</td>' }) -join ''
    }
    
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        $trimmed = $line.Trim()
        
        if ($trimmed -eq '') {
            Close-List
            Close-Table
            continue
        }
        
        # 表格行
        if ($trimmed.StartsWith('|') -or ($trimmed.IndexOf('|') -gt 0 -and $trimmed.EndsWith('|'))) {
            Close-List
            # 跳过分隔行
            if ($trimmed -match '^\|[\s\-:|]+\|$') {
                continue
            }
            if (-not $inTable) { $inTable = $true; $tableRows = @() }
            $tableRows += Parse-Row $trimmed
            continue
        }
        
        Close-Table
        
        # H2
        if ($trimmed -match '^##\s+') {
            Close-List
            $html += '<h2>' + (Convert-Inline ($trimmed -replace '^##\s+', '')) + '</h2>'
            continue
        }
        # H1
        if ($trimmed -match '^#\s+') {
            Close-List
            $html += '<h2>' + (Convert-Inline ($trimmed -replace '^#\s+', '')) + '</h2>'
            continue
        }
        
        # 列表项
        if ($trimmed -match '^[-•]\s+') {
            if (-not $inList) { $html += '<ul>'; $inList = $true }
            $html += '<li>' + (Convert-Inline ($trimmed -replace '^[-•]\s+', '')) + '</li>'
            continue
        }
        
        # 普通段落
        Close-List
        $html += '<p>' + (Convert-Inline $trimmed) + '</p>'
    }
    Close-List
    Close-Table
    return $html -join "`n"
}

# 原始文章数据（Markdown 格式）
$articles = @{
    'india-manufacturing' = @{
        title = @{ en = 'Why PXID Chose India for Electric Bike Manufacturing'; zh = 'PXID 为何选择在印度制造电动自行车' }
        tag = @{ en = 'China R&D + India Production Strategy'; zh = '中国研发 + 印度生产战略' }
        date = '2026-06-27'
        image = 'news-1182.jpg'
        contentEn = @"
**Why PXID is Building Manufacturing in India**

Global manufacturing is rapidly evolving. PXID is expanding its production footprint in India to build a more resilient global supply chain—combining **China's R&D and engineering strength** with **India's localized manufacturing and export advantages.**

## 1. The Role of PXID China Factory

For **PXID**, the China facility is not just a production base—it is the core **global R&D center**.

With over 12 years of experience in **electric mobility product development**, the China team manages the full process from concept to mass production, including:

- Industrial design
- Mechanical & structural engineering
- Prototype development
- Mold/tooling development
- Frame manufacturing
- Lab testing & validation
- Quality assurance

Within the global supply chain, **China focuses on high-value engineering and R&D**, while **India handles localized manufacturing and regional delivery**, forming a true **"China R&D + India Manufacturing" global model**.

## 2. Role of the Pune Manufacturing Facility (India)

The **PXID Pune factory in India** is a key strategic production hub in the global supply chain.

**Pune** is one of India's leading automotive and advanced manufacturing centers, with a mature ecosystem of suppliers and skilled engineering talent supporting the **electric bicycle industry**.

The India facility will gradually develop capabilities including:

- Full e-bike assembly
- Quality inspection & testing
- Local sourcing
- After-sales technical support

This enables more flexible manufacturing solutions for markets such as **Europe, the Middle East, and other global regions**.

## 3. China R&D + India Manufacturing Model

This is the core operational strategy behind PXID's global expansion.

Workflow overview:

- Product Concept
- **Industrial Design (China)**
- Mechanical Engineering (China)
- Prototype Validation (China)
- Laboratory Testing (China)
- Engineering Approval
- Transfer to **India (Pune)**
- Local Assembly & Production
- Quality Inspection
- Global Export (Europe / Middle East / Asia)

This model ensures:

- Faster scalability
- Lower logistics pressure
- Stronger regional responsiveness
- Consistent global quality standards

## 4. European Regulations & Compliance

| **Standard** | **PXID Compliance Capability** |
|---|---|
| **CE Marking** | Products can be prepared to meet EU regulatory requirements |
| **EN15194** | E-bikes can be designed, tested, and documented to comply |
| **RoHS / REACH** | Material and chemical safety compliance for components |
| **EMC / LVD** | Electrical safety and electromagnetic compatibility validation |
| **UN38.3 / MSDS** | Battery transportation and safety documentation for global shipping |

## 5. Global Two-Wheeler Manufacturing Landscape

Global production strategy overview:

- **China**: Global R&D center, high-end manufacturing, ODM/OEM innovation
- **India**: Localized assembly, regional supply chain, export flexibility
- **Vietnam**: Contract manufacturing hub for export production
- **Taiwan**: High-end bicycle components
- **Europe**: Premium bicycle brands, R&D, assembly
- **USA**: Product design and market development

This diversified structure supports a more stable and flexible global supply chain for the electric mobility industry.

## FAQ

**Is the quality different if production moves from China to India?**

All products are engineered by PXID China and manufactured under the same quality management system. India follows identical engineering drawings, testing standards and inspection procedures.

**Why is PXID manufacturing in India instead of only China?**

Because customers increasingly need a more flexible global supply chain, shorter delivery times and better regional manufacturing options while maintaining consistent product quality.

**Will products made in India meet European regulations?**

Yes. Products can be manufactured to comply with CE, EN15194, RoHS, REACH, EMC, Battery Regulation and other market-specific requirements based on customer needs.

**Can PXID customize electric bikes for my brand?**

Yes. PXID provides complete ODM and OEM services including industrial design, mechanical engineering, prototype development, mold manufacturing, mass production and worldwide delivery.
"@
        contentZh = @"
**PXID 为何在印度布局制造**

全球制造业正在快速演变。PXID 正在印度扩大生产布局，构建更具韧性的全球供应链——结合**中国的研发与工程实力**与**印度的本地化制造和出口优势**。

## 1. PXID 中国工厂的角色

对 **PXID** 而言，中国工厂不仅是生产基地，更是核心的**全球研发中心**。

凭借超过 12 年的**电动出行产品开发经验**，中国团队管理从概念到量产的全过程，包括：

- 工业设计
- 机械与结构工程
- 原型开发
- 模具开发
- 车架制造
- 实验室测试验证
- 质量保证

在全球供应链中，**中国专注于高价值工程与研发**，而**印度负责本地化制造和区域交付**，形成真正的**"中国研发 + 印度制造"**全球模式。

## 2. 印度浦那制造基地的角色

**PXID 印度浦那工厂**是全球供应链中的重要战略生产枢纽。

**浦那**是印度领先的汽车和先进制造业中心之一，拥有成熟的供应商生态系统和熟练的工程人才，支持**电动自行车产业**发展。

印度工厂将逐步发展以下能力：

- 整车组装
- 质量检测与测试
- 本地化采购
- 售后技术支持

这为**欧洲、中东及其他全球地区**市场提供更灵活的制造解决方案。

## 3. 中国研发 + 印度制造模式

这是 PXID 全球扩张背后的核心运营战略。

工作流程概览：

- 产品概念
- **工业设计（中国）**
- 机械工程（中国）
- 原型验证（中国）
- 实验室测试（中国）
- 工程确认
- 转移至**印度（浦那）**
- 本地组装与生产
- 质量检测
- 全球出口（欧洲 / 中东 / 亚洲）

该模式确保：

- 更快的规模化能力
- 更低的物流压力
- 更强的区域响应能力
- 一致的全球质量标准

## 4. 欧洲法规与合规

| **标准** | **PXID 合规能力** |
|---|---|
| **CE 认证** | 产品可按欧盟法规要求准备 |
| **EN15194** | 电动自行车可按标准设计、测试并出具文档 |
| **RoHS / REACH** | 零部件材料与化学安全合规 |
| **EMC / LVD** | 电气安全与电磁兼容验证 |
| **UN38.3 / MSDS** | 全球运输电池安全文档 |

## 5. 全球两轮车制造格局

全球生产战略概览：

- **中国**：全球研发中心、高端制造、ODM/OEM 创新
- **印度**：本地化组装、区域供应链、出口灵活性
- **越南**：出口生产代工基地
- **台湾**：高端自行车零部件
- **欧洲**：高端自行车品牌、研发、组装
- **美国**：产品设计与市场开发

这种多元化结构为电动出行产业提供了更稳定、更灵活的全球供应链。

## 常见问题

**如果生产从中国转移到印度，质量会有差异吗？**

所有产品均由 PXID 中国团队设计，在相同的质量管理体系下生产。印度工厂遵循相同的工程图纸、测试标准和检验流程。

**为什么 PXID 选择在印度制造，而不是只在中国？**

因为客户越来越需要更灵活的全球供应链、更短的交付周期和更好的区域制造选择，同时保持一致的产品质量。

**印度制造的产品会符合欧洲法规吗？**

是的。可根据客户需求生产符合 CE、EN15194、RoHS、REACH、EMC、电池法规等市场特定要求的产品。

**PXID 可以为我的品牌定制电动自行车吗？**

可以。PXID 提供完整的 ODM 和 OEM 服务，包括工业设计、机械工程、原型开发、模具制造、量产和全球交付。
"@
    }
}

# 测试转换
$result = Convert-MarkdownToHtml $articles['india-manufacturing'].contentEn
Write-Host "Conversion test successful, HTML length: $($result.Length)"
Write-Host "First 200 chars:"
Write-Host $result.Substring(0, [Math]::Min(200, $result.Length))
