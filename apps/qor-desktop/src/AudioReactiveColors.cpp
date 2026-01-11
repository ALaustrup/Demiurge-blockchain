/**
 * AudioReactiveColors.cpp - Implementation
 */

#include "AudioReactiveColors.h"
#include <QDebug>
#include <QtMath>
#include <QRandomGenerator>

namespace QOR {

AudioReactiveColors::AudioReactiveColors(QObject *parent)
    : QObject(parent)
    , m_bassLevel(0.0)
    , m_midLevel(0.0)
    , m_trebleLevel(0.0)
    , m_overallLevel(0.0)
    , m_basePrimary(QColor("#00FFFF"))      // Neon Cyan
    , m_baseSecondary(QColor("#8A2BE2"))    // Electric Purple
    , m_baseTertiary(QColor("#FFD700"))     // Deep Gold
    , m_primaryColor(m_basePrimary)
    , m_secondaryColor(m_baseSecondary)
    , m_tertiaryColor(m_baseTertiary)
    , m_enabled(true)
    , m_sensitivity(1.0)
{
    // Update timer for smooth color transitions
    m_updateTimer = new QTimer(this);
    connect(m_updateTimer, &QTimer::timeout, this, &AudioReactiveColors::processAudio);
    m_updateTimer->start(50); // 20 FPS
    
    qInfo() << "AudioReactiveColors initialized (sensitivity:" << m_sensitivity << ")";
    qInfo() << "   Using sine wave animation (audio capture disabled for simplicity)";
}

AudioReactiveColors::~AudioReactiveColors()
{
    if (m_updateTimer) {
        m_updateTimer->stop();
    }
}

void AudioReactiveColors::setBasePrimary(const QColor &color)
{
    if (m_basePrimary != color) {
        m_basePrimary = color;
        emit basePrimaryChanged();
        updateColors();
    }
}

void AudioReactiveColors::setBaseSecondary(const QColor &color)
{
    if (m_baseSecondary != color) {
        m_baseSecondary = color;
        emit baseSecondaryChanged();
        updateColors();
    }
}

void AudioReactiveColors::setBaseTertiary(const QColor &color)
{
    if (m_baseTertiary != color) {
        m_baseTertiary = color;
        emit baseTertiaryChanged();
        updateColors();
    }
}

void AudioReactiveColors::setEnabled(bool enabled)
{
    if (m_enabled != enabled) {
        m_enabled = enabled;
        
        if (!enabled) {
            // Reset to base colors
            m_primaryColor = m_basePrimary;
            m_secondaryColor = m_baseSecondary;
            m_tertiaryColor = m_baseTertiary;
            emit primaryColorChanged();
            emit secondaryColorChanged();
            emit tertiaryColorChanged();
        }
        
        emit enabledChanged();
    }
}

void AudioReactiveColors::setSensitivity(double sensitivity)
{
    if (m_sensitivity != sensitivity) {
        m_sensitivity = qBound(0.1, sensitivity, 5.0);
        emit sensitivityChanged();
    }
}

void AudioReactiveColors::refresh()
{
    processAudio();
}

void AudioReactiveColors::processAudio()
{
    if (!m_enabled) {
        return;
    }
    
    // Use smooth sine wave animation for demo
    // In production, this would analyze actual audio input
    static double phase = 0.0;
    phase += 0.05;
    
    m_bassLevel = (qSin(phase) + 1.0) / 2.0 * 0.3 * m_sensitivity;
    m_midLevel = (qSin(phase * 1.5) + 1.0) / 2.0 * 0.2 * m_sensitivity;
    m_trebleLevel = (qSin(phase * 2.0) + 1.0) / 2.0 * 0.15 * m_sensitivity;
    m_overallLevel = (m_bassLevel + m_midLevel + m_trebleLevel) / 3.0;
    
    // Clamp to 0-1 range
    m_bassLevel = qBound(0.0, m_bassLevel, 1.0);
    m_midLevel = qBound(0.0, m_midLevel, 1.0);
    m_trebleLevel = qBound(0.0, m_trebleLevel, 1.0);
    m_overallLevel = qBound(0.0, m_overallLevel, 1.0);
    
    emit audioLevelsChanged();
    updateColors();
}

void AudioReactiveColors::updateColors()
{
    // Modulate colors based on audio levels
    QColor newPrimary = modulateColor(m_basePrimary, m_bassLevel);
    QColor newSecondary = modulateColor(m_baseSecondary, m_midLevel);
    QColor newTertiary = modulateColor(m_baseTertiary, m_trebleLevel);
    
    if (newPrimary != m_primaryColor) {
        m_primaryColor = newPrimary;
        emit primaryColorChanged();
    }
    
    if (newSecondary != m_secondaryColor) {
        m_secondaryColor = newSecondary;
        emit secondaryColorChanged();
    }
    
    if (newTertiary != m_tertiaryColor) {
        m_tertiaryColor = newTertiary;
        emit tertiaryColorChanged();
    }
}

QColor AudioReactiveColors::modulateColor(const QColor &baseColor, double intensity)
{
    if (!m_enabled) {
        return baseColor;
    }
    
    // Increase brightness and saturation based on intensity
    QColor modulated = baseColor;
    
    int h, s, v, a;
    modulated.getHsv(&h, &s, &v, &a);
    
    // Boost value (brightness) by up to 20% based on intensity
    v = qBound(0, v + static_cast<int>(intensity * 50), 255);
    
    // Boost saturation slightly
    s = qBound(0, s + static_cast<int>(intensity * 30), 255);
    
    modulated.setHsv(h, s, v, a);
    
    return modulated;
}

} // namespace QOR
