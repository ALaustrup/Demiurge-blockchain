/**
 * AudioReactiveColors.h - FFT-Based Audio Analysis
 * 
 * Analyzes system audio output and modulates UI colors
 * based on frequency spectrum (bass, mid, treble).
 */

#pragma once

#include <QObject>
#include <QColor>
#include <QTimer>

namespace QOR {

class AudioReactiveColors : public QObject
{
    Q_OBJECT
    
    // Audio levels (0.0 - 1.0)
    Q_PROPERTY(double bassLevel READ bassLevel NOTIFY audioLevelsChanged)
    Q_PROPERTY(double midLevel READ midLevel NOTIFY audioLevelsChanged)
    Q_PROPERTY(double trebleLevel READ trebleLevel NOTIFY audioLevelsChanged)
    Q_PROPERTY(double overallLevel READ overallLevel NOTIFY audioLevelsChanged)
    
    // Modulated colors
    Q_PROPERTY(QColor primaryColor READ primaryColor NOTIFY primaryColorChanged)
    Q_PROPERTY(QColor secondaryColor READ secondaryColor NOTIFY secondaryColorChanged)
    Q_PROPERTY(QColor tertiaryColor READ tertiaryColor NOTIFY tertiaryColorChanged)
    
    // Base colors (set from QML Theme)
    Q_PROPERTY(QColor basePrimary READ basePrimary WRITE setBasePrimary NOTIFY basePrimaryChanged)
    Q_PROPERTY(QColor baseSecondary READ baseSecondary WRITE setBaseSecondary NOTIFY baseSecondaryChanged)
    Q_PROPERTY(QColor baseTertiary READ baseTertiary WRITE setBaseTertiary NOTIFY baseTertiaryChanged)
    
    // Control
    Q_PROPERTY(bool enabled READ enabled WRITE setEnabled NOTIFY enabledChanged)
    Q_PROPERTY(double sensitivity READ sensitivity WRITE setSensitivity NOTIFY sensitivityChanged)

public:
    explicit AudioReactiveColors(QObject *parent = nullptr);
    ~AudioReactiveColors();
    
    // Audio levels
    double bassLevel() const { return m_bassLevel; }
    double midLevel() const { return m_midLevel; }
    double trebleLevel() const { return m_trebleLevel; }
    double overallLevel() const { return m_overallLevel; }
    
    // Modulated colors
    QColor primaryColor() const { return m_primaryColor; }
    QColor secondaryColor() const { return m_secondaryColor; }
    QColor tertiaryColor() const { return m_tertiaryColor; }
    
    // Base colors
    QColor basePrimary() const { return m_basePrimary; }
    void setBasePrimary(const QColor &color);
    
    QColor baseSecondary() const { return m_baseSecondary; }
    void setBaseSecondary(const QColor &color);
    
    QColor baseTertiary() const { return m_baseTertiary; }
    void setBaseTertiary(const QColor &color);
    
    // Control
    bool enabled() const { return m_enabled; }
    void setEnabled(bool enabled);
    
    double sensitivity() const { return m_sensitivity; }
    void setSensitivity(double sensitivity);
    
    // Manual update
    Q_INVOKABLE void refresh();

signals:
    void audioLevelsChanged();
    void primaryColorChanged();
    void secondaryColorChanged();
    void tertiaryColorChanged();
    void basePrimaryChanged();
    void baseSecondaryChanged();
    void baseTertiaryChanged();
    void enabledChanged();
    void sensitivityChanged();

private slots:
    void processAudio();

private:
    void updateColors();
    QColor modulateColor(const QColor &baseColor, double intensity);
    
    // Audio levels
    double m_bassLevel;
    double m_midLevel;
    double m_trebleLevel;
    double m_overallLevel;
    
    // Base colors
    QColor m_basePrimary;
    QColor m_baseSecondary;
    QColor m_baseTertiary;
    
    // Modulated colors
    QColor m_primaryColor;
    QColor m_secondaryColor;
    QColor m_tertiaryColor;
    
    // Control
    bool m_enabled;
    double m_sensitivity;
    
    // Update timer
    QTimer *m_updateTimer;
};

} // namespace QOR
