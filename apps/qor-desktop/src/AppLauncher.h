/**
 * AppLauncher - Application Mode Selection
 * 
 * Provides a unified launcher for switching between different Abyss Suite applications.
 */

#ifndef APPLAUNCHER_H
#define APPLAUNCHER_H

#include <QWidget>
#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QLabel>
#include <QPushButton>
#include <QCheckBox>
#include <QPropertyAnimation>
#include <QSettings>

/**
 * Available application modes
 */
enum class AppMode {
    AbyssOS,    // Full desktop experience
    Explorer,   // Web3 browser
    Neon,       // Media player
    Craft,      // IDE
    Docs        // Document editor
};

/**
 * Application info structure
 */
struct AppInfo {
    AppMode mode;
    QString name;
    QString description;
    QString icon;
    QString shortcut;
};

/**
 * Individual app tile in the launcher
 */
class AppTile : public QPushButton {
    Q_OBJECT

public:
    explicit AppTile(const AppInfo &info, QWidget *parent = nullptr);
    
    AppInfo info() const { return m_info; }
    void setSelected(bool selected);

protected:
    void enterEvent(QEnterEvent *event) override;
    void leaveEvent(QEvent *event) override;
    void paintEvent(QPaintEvent *event) override;

private:
    AppInfo m_info;
    bool m_selected = false;
    bool m_hovered = false;
};

/**
 * Main application launcher widget
 */
class AppLauncher : public QWidget {
    Q_OBJECT

public:
    explicit AppLauncher(QWidget *parent = nullptr);
    ~AppLauncher();

    AppMode selectedApp() const { return m_selectedApp; }
    void setSelectedApp(AppMode mode);
    
    bool rememberChoice() const { return m_rememberChoice; }
    bool launchAtStartup() const { return m_launchAtStartup; }

public slots:
    void show();
    void hide();
    void launch();

signals:
    void appSelected(AppMode mode);
    void launchRequested(AppMode mode);

protected:
    void keyPressEvent(QKeyEvent *event) override;
    void paintEvent(QPaintEvent *event) override;

private:
    void setupUI();
    void loadSettings();
    void saveSettings();
    void createAppTile(const AppInfo &info);
    void updateSelection();

    QVBoxLayout *m_mainLayout;
    QHBoxLayout *m_tilesLayout;
    QList<AppTile*> m_tiles;
    QPushButton *m_launchButton;
    QCheckBox *m_rememberCheckbox;
    QCheckBox *m_startupCheckbox;
    
    AppMode m_selectedApp = AppMode::AbyssOS;
    bool m_rememberChoice = false;
    bool m_launchAtStartup = false;
    
    QSettings m_settings;
};

/**
 * Quick Switcher (popup for fast app switching)
 */
class QuickSwitcher : public QWidget {
    Q_OBJECT

public:
    explicit QuickSwitcher(QWidget *parent = nullptr);
    
    void showCentered();
    void selectNext();
    void selectPrevious();
    void activateSelection();

signals:
    void appSelected(AppMode mode);

protected:
    void keyPressEvent(QKeyEvent *event) override;
    void focusOutEvent(QFocusEvent *event) override;
    void paintEvent(QPaintEvent *event) override;

private:
    void setupUI();
    void updateHighlight();

    QList<QPushButton*> m_buttons;
    int m_selectedIndex = 0;
};

#endif // APPLAUNCHER_H
