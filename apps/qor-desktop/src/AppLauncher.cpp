/**
 * AppLauncher Implementation
 */

#include "AppLauncher.h"

#include <QKeyEvent>
#include <QPainter>
#include <QGraphicsDropShadowEffect>
#include <QShortcut>
#include <QApplication>
#include <QScreen>

// App definitions
static const QList<AppInfo> APP_LIST = {
    { AppMode::QorOS,  "QOR OS",  "Full desktop experience", "🌊", "Ctrl+1" },
    { AppMode::Explorer, "Explorer",  "Web3 browser",           "🔍", "Ctrl+2" },
    { AppMode::Neon,     "NEON",      "Media player",           "🎵", "Ctrl+3" },
    { AppMode::Craft,    "CRAFT",     "Code editor & IDE",      "⚡", "Ctrl+4" },
    { AppMode::Docs,     "Docs",      "Document editor",        "📝", "Ctrl+5" },
};

// ============================================================================
// AppTile
// ============================================================================

AppTile::AppTile(const AppInfo &info, QWidget *parent)
    : QPushButton(parent)
    , m_info(info)
{
    setFixedSize(140, 140);
    setCursor(Qt::PointingHandCursor);
    setFocusPolicy(Qt::StrongFocus);
    
    // Drop shadow effect
    auto *shadow = new QGraphicsDropShadowEffect(this);
    shadow->setBlurRadius(20);
    shadow->setOffset(0, 4);
    shadow->setColor(QColor(0, 0, 0, 80));
    setGraphicsEffect(shadow);
}

void AppTile::setSelected(bool selected)
{
    m_selected = selected;
    update();
}

void AppTile::enterEvent(QEnterEvent *event)
{
    m_hovered = true;
    update();
    QPushButton::enterEvent(event);
}

void AppTile::leaveEvent(QEvent *event)
{
    m_hovered = false;
    update();
    QPushButton::leaveEvent(event);
}

void AppTile::paintEvent(QPaintEvent *event)
{
    Q_UNUSED(event)
    
    QPainter painter(this);
    painter.setRenderHint(QPainter::Antialiasing);
    
    QRect r = rect().adjusted(4, 4, -4, -4);
    
    // Background
    QColor bgColor = m_selected ? QColor(0, 200, 255, 40) 
                   : m_hovered ? QColor(30, 40, 60) 
                   : QColor(20, 30, 50);
    
    painter.setPen(Qt::NoPen);
    painter.setBrush(bgColor);
    painter.drawRoundedRect(r, 16, 16);
    
    // Border
    if (m_selected) {
        painter.setPen(QPen(QColor(0, 200, 255), 2));
        painter.setBrush(Qt::NoBrush);
        painter.drawRoundedRect(r, 16, 16);
    }
    
    // Icon
    QFont iconFont = font();
    iconFont.setPointSize(36);
    painter.setFont(iconFont);
    painter.setPen(Qt::white);
    painter.drawText(r.adjusted(0, 20, 0, -40), Qt::AlignHCenter | Qt::AlignTop, m_info.icon);
    
    // Name
    QFont nameFont = font();
    nameFont.setPointSize(12);
    nameFont.setBold(true);
    painter.setFont(nameFont);
    painter.drawText(r.adjusted(0, 70, 0, -20), Qt::AlignHCenter | Qt::AlignTop, m_info.name);
    
    // Description
    QFont descFont = font();
    descFont.setPointSize(9);
    painter.setFont(descFont);
    painter.setPen(QColor(150, 150, 150));
    painter.drawText(r.adjusted(0, 90, 0, 0), Qt::AlignHCenter | Qt::AlignTop, m_info.description);
}

// ============================================================================
// AppLauncher
// ============================================================================

AppLauncher::AppLauncher(QWidget *parent)
    : QWidget(parent)
    , m_settings("Demiurge", "AbyssSuite")
{
    setWindowFlags(Qt::FramelessWindowHint | Qt::WindowStaysOnTopHint);
    setAttribute(Qt::WA_TranslucentBackground);
    
    loadSettings();
    setupUI();
    
    // Center on screen
    resize(700, 400);
}

AppLauncher::~AppLauncher()
{
    saveSettings();
}

void AppLauncher::setupUI()
{
    m_mainLayout = new QVBoxLayout(this);
    m_mainLayout->setContentsMargins(40, 40, 40, 40);
    m_mainLayout->setSpacing(20);
    
    // Title
    auto *titleLabel = new QLabel("ABYSS SUITE", this);
    QFont titleFont = titleLabel->font();
    titleFont.setPointSize(24);
    titleFont.setBold(true);
    titleLabel->setFont(titleFont);
    titleLabel->setStyleSheet("color: #00c8ff;");
    titleLabel->setAlignment(Qt::AlignCenter);
    m_mainLayout->addWidget(titleLabel);
    
    // App tiles
    m_tilesLayout = new QHBoxLayout();
    m_tilesLayout->setSpacing(16);
    m_tilesLayout->setAlignment(Qt::AlignCenter);
    
    for (const auto &info : APP_LIST) {
        createAppTile(info);
    }
    
    m_mainLayout->addLayout(m_tilesLayout);
    
    // Launch button
    m_launchButton = new QPushButton("Launch", this);
    m_launchButton->setFixedSize(200, 40);
    m_launchButton->setStyleSheet(R"(
        QPushButton {
            background: qlineargradient(x1:0, y1:0, x2:1, y2:0, stop:0 #00c8ff, stop:1 #8b5cf6);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: bold;
        }
        QPushButton:hover {
            background: qlineargradient(x1:0, y1:0, x2:1, y2:0, stop:0 #00d8ff, stop:1 #9b6cf6);
        }
        QPushButton:pressed {
            background: qlineargradient(x1:0, y1:0, x2:1, y2:0, stop:0 #00b8ef, stop:1 #7b4ce6);
        }
    )");
    connect(m_launchButton, &QPushButton::clicked, this, &AppLauncher::launch);
    
    auto *buttonLayout = new QHBoxLayout();
    buttonLayout->setAlignment(Qt::AlignCenter);
    buttonLayout->addWidget(m_launchButton);
    m_mainLayout->addLayout(buttonLayout);
    
    // Options
    auto *optionsLayout = new QHBoxLayout();
    optionsLayout->setAlignment(Qt::AlignCenter);
    optionsLayout->setSpacing(30);
    
    m_rememberCheckbox = new QCheckBox("Remember my choice", this);
    m_rememberCheckbox->setStyleSheet("color: #888; font-size: 12px;");
    m_rememberCheckbox->setChecked(m_rememberChoice);
    connect(m_rememberCheckbox, &QCheckBox::toggled, [this](bool checked) {
        m_rememberChoice = checked;
    });
    
    m_startupCheckbox = new QCheckBox("Launch at startup", this);
    m_startupCheckbox->setStyleSheet("color: #888; font-size: 12px;");
    m_startupCheckbox->setChecked(m_launchAtStartup);
    connect(m_startupCheckbox, &QCheckBox::toggled, [this](bool checked) {
        m_launchAtStartup = checked;
    });
    
    optionsLayout->addWidget(m_rememberCheckbox);
    optionsLayout->addWidget(m_startupCheckbox);
    m_mainLayout->addLayout(optionsLayout);
    
    updateSelection();
}

void AppLauncher::createAppTile(const AppInfo &info)
{
    auto *tile = new AppTile(info, this);
    connect(tile, &QPushButton::clicked, [this, tile]() {
        if (m_selectedApp == tile->info().mode) {
            // Double-click behavior: second click on selected launches
            launch();
        } else {
            setSelectedApp(tile->info().mode);
        }
    });
    
    m_tiles.append(tile);
    m_tilesLayout->addWidget(tile);
}

void AppLauncher::setSelectedApp(AppMode mode)
{
    m_selectedApp = mode;
    updateSelection();
    emit appSelected(mode);
}

void AppLauncher::updateSelection()
{
    for (auto *tile : m_tiles) {
        tile->setSelected(tile->info().mode == m_selectedApp);
    }
}

void AppLauncher::show()
{
    QWidget::show();
    raise();
    activateWindow();
}

void AppLauncher::hide()
{
    QWidget::hide();
}

void AppLauncher::launch()
{
    saveSettings();
    emit launchRequested(m_selectedApp);
    hide();
}

void AppLauncher::loadSettings()
{
    m_selectedApp = static_cast<AppMode>(m_settings.value("lastApp", 0).toInt());
    m_rememberChoice = m_settings.value("rememberChoice", false).toBool();
    m_launchAtStartup = m_settings.value("launchAtStartup", false).toBool();
}

void AppLauncher::saveSettings()
{
    m_settings.setValue("lastApp", static_cast<int>(m_selectedApp));
    m_settings.setValue("rememberChoice", m_rememberChoice);
    m_settings.setValue("launchAtStartup", m_launchAtStartup);
}

void AppLauncher::keyPressEvent(QKeyEvent *event)
{
    switch (event->key()) {
        case Qt::Key_1:
            if (event->modifiers() & Qt::ControlModifier) {
                setSelectedApp(AppMode::QorOS);
            }
            break;
        case Qt::Key_2:
            if (event->modifiers() & Qt::ControlModifier) {
                setSelectedApp(AppMode::Explorer);
            }
            break;
        case Qt::Key_3:
            if (event->modifiers() & Qt::ControlModifier) {
                setSelectedApp(AppMode::Neon);
            }
            break;
        case Qt::Key_4:
            if (event->modifiers() & Qt::ControlModifier) {
                setSelectedApp(AppMode::Craft);
            }
            break;
        case Qt::Key_5:
            if (event->modifiers() & Qt::ControlModifier) {
                setSelectedApp(AppMode::Docs);
            }
            break;
        case Qt::Key_Return:
        case Qt::Key_Enter:
            launch();
            break;
        case Qt::Key_Escape:
            hide();
            break;
        case Qt::Key_Left: {
            int idx = static_cast<int>(m_selectedApp);
            if (idx > 0) {
                setSelectedApp(static_cast<AppMode>(idx - 1));
            }
            break;
        }
        case Qt::Key_Right: {
            int idx = static_cast<int>(m_selectedApp);
            if (idx < APP_LIST.size() - 1) {
                setSelectedApp(static_cast<AppMode>(idx + 1));
            }
            break;
        }
        default:
            QWidget::keyPressEvent(event);
    }
}

void AppLauncher::paintEvent(QPaintEvent *event)
{
    Q_UNUSED(event)
    
    QPainter painter(this);
    painter.setRenderHint(QPainter::Antialiasing);
    
    // Semi-transparent dark background
    painter.setPen(Qt::NoPen);
    painter.setBrush(QColor(10, 15, 30, 240));
    painter.drawRoundedRect(rect().adjusted(20, 20, -20, -20), 24, 24);
    
    // Border
    painter.setPen(QPen(QColor(0, 200, 255, 50), 1));
    painter.setBrush(Qt::NoBrush);
    painter.drawRoundedRect(rect().adjusted(20, 20, -20, -20), 24, 24);
}

// ============================================================================
// QuickSwitcher
// ============================================================================

QuickSwitcher::QuickSwitcher(QWidget *parent)
    : QWidget(parent)
{
    setWindowFlags(Qt::FramelessWindowHint | Qt::WindowStaysOnTopHint | Qt::Popup);
    setAttribute(Qt::WA_TranslucentBackground);
    setFixedSize(300, 280);
    
    setupUI();
}

void QuickSwitcher::setupUI()
{
    auto *layout = new QVBoxLayout(this);
    layout->setContentsMargins(16, 16, 16, 16);
    layout->setSpacing(4);
    
    // Title
    auto *title = new QLabel("Switch Application", this);
    title->setStyleSheet("color: #888; font-size: 12px;");
    layout->addWidget(title);
    
    // Separator
    auto *sep = new QFrame(this);
    sep->setFrameShape(QFrame::HLine);
    sep->setStyleSheet("background: #333;");
    layout->addWidget(sep);
    
    // App buttons
    for (const auto &info : APP_LIST) {
        auto *btn = new QPushButton(this);
        btn->setText(QString("%1  %2").arg(info.icon, info.name));
        btn->setStyleSheet(R"(
            QPushButton {
                background: transparent;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 10px 16px;
                text-align: left;
                font-size: 14px;
            }
            QPushButton:hover {
                background: rgba(0, 200, 255, 0.1);
            }
        )");
        
        int idx = static_cast<int>(info.mode);
        connect(btn, &QPushButton::clicked, [this, idx]() {
            emit appSelected(static_cast<AppMode>(idx));
            hide();
        });
        
        m_buttons.append(btn);
        layout->addWidget(btn);
    }
    
    layout->addStretch();
}

void QuickSwitcher::showCentered()
{
    m_selectedIndex = 0;
    updateHighlight();
    
    // Center on screen
    QScreen *screen = QApplication::primaryScreen();
    QRect screenGeometry = screen->availableGeometry();
    move(screenGeometry.center() - rect().center());
    
    show();
    raise();
    activateWindow();
    setFocus();
}

void QuickSwitcher::selectNext()
{
    m_selectedIndex = (m_selectedIndex + 1) % m_buttons.size();
    updateHighlight();
}

void QuickSwitcher::selectPrevious()
{
    m_selectedIndex = (m_selectedIndex - 1 + m_buttons.size()) % m_buttons.size();
    updateHighlight();
}

void QuickSwitcher::activateSelection()
{
    if (m_selectedIndex >= 0 && m_selectedIndex < m_buttons.size()) {
        emit appSelected(static_cast<AppMode>(m_selectedIndex));
        hide();
    }
}

void QuickSwitcher::updateHighlight()
{
    for (int i = 0; i < m_buttons.size(); ++i) {
        m_buttons[i]->setStyleSheet(QString(R"(
            QPushButton {
                background: %1;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 10px 16px;
                text-align: left;
                font-size: 14px;
            }
        )").arg(i == m_selectedIndex ? "rgba(0, 200, 255, 0.2)" : "transparent"));
    }
}

void QuickSwitcher::keyPressEvent(QKeyEvent *event)
{
    switch (event->key()) {
        case Qt::Key_Down:
        case Qt::Key_Tab:
            selectNext();
            break;
        case Qt::Key_Up:
        case Qt::Key_Backtab:
            selectPrevious();
            break;
        case Qt::Key_Return:
        case Qt::Key_Enter:
            activateSelection();
            break;
        case Qt::Key_Escape:
            hide();
            break;
        case Qt::Key_1:
        case Qt::Key_2:
        case Qt::Key_3:
        case Qt::Key_4:
        case Qt::Key_5: {
            int idx = event->key() - Qt::Key_1;
            if (idx < m_buttons.size()) {
                emit appSelected(static_cast<AppMode>(idx));
                hide();
            }
            break;
        }
        default:
            QWidget::keyPressEvent(event);
    }
}

void QuickSwitcher::focusOutEvent(QFocusEvent *event)
{
    Q_UNUSED(event)
    hide();
}

void QuickSwitcher::paintEvent(QPaintEvent *event)
{
    Q_UNUSED(event)
    
    QPainter painter(this);
    painter.setRenderHint(QPainter::Antialiasing);
    
    // Background
    painter.setPen(Qt::NoPen);
    painter.setBrush(QColor(20, 25, 40, 250));
    painter.drawRoundedRect(rect(), 12, 12);
    
    // Border
    painter.setPen(QPen(QColor(60, 70, 90), 1));
    painter.setBrush(Qt::NoBrush);
    painter.drawRoundedRect(rect(), 12, 12);
}
