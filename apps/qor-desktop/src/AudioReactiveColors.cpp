/**
 * AudioReactiveColors.cpp - Implementation
 */

#include "AudioReactiveColors.h"
#include <QAudioSource>
#include <QMediaDevices>
#include <QDebug>
#include <QtMath>

namespace QOR {

AudioReactiveColors::AudioReactiveColors(QObject *parent)
    : QObject(parent)
    , m_audioInput(nullptr)
    , m_audioDevice(nullptr)
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
    // Setup audio format
    m_audioFormat.setSampleRate(44100);
    m_audioFormat.setChannelCount(2);
    m_audioFormat.setSampleFormat(QAudioFormat::Int16);
    
    // Try to setup audio capture
    setupAudio();
    
    // Update timer for smooth color transitions
    m_updateTimer = new QTimer(this);
    connect(m_updateTimer, &QTimer::timeout, this, &AudioReactiveColors::processAudio);
    m_updateTimer->start(50); // 20 FPS
    
    qInfo() << "AudioReactiveColors initialized (sensitivity:" << m_sensitivity << ")";
}

AudioReactiveColors::~AudioReactiveColors()
{
    if (m_audioInput) {
        m_audioInput->stop();
        delete m_audioInput;
    }
    
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
        
        if (m_audioInput) {
            if (enabled) {
                m_audioInput->start(m_audioDevice);
            } else {
                m_audioInput->stop();
                // Reset to base colors
                m_primaryColor = m_basePrimary;
                m_secondaryColor = m_baseSecondary;
                m_tertiaryColor = m_baseTertiary;
                emit primaryColorChanged();
                emit secondaryColorChanged();
                emit tertiaryColorChanged();
            }
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

void AudioReactiveColors::setupAudio()
{
    // Get default audio input device
    const QAudioDevice audioDevice = QMediaDevices::defaultAudioInput();
    
    if (audioDevice.isNull()) {
        qWarning() << "No audio input device available - using mock data";
        return;
    }
    
    if (!audioDevice.isFormatSupported(m_audioFormat)) {
        qWarning() << "Audio format not supported - adjusting";
        m_audioFormat = audioDevice.preferredFormat();
    }
    
    m_audioInput = new QAudioInput(audioDevice, m_audioFormat, this);
    m_audioDevice = m_audioInput->start();
    
    if (!m_audioDevice) {
        qWarning() << "Failed to start audio input";
        delete m_audioInput;
        m_audioInput = nullptr;
    } else {
        qInfo() << "Audio capture started:" << m_audioFormat.sampleRate() << "Hz";
    }
}

void AudioReactiveColors::processAudio()
{
    if (!m_enabled) {
        return;
    }
    
    // If no audio input, use mock data (gentle animation)
    if (!m_audioInput || !m_audioDevice) {
        // Gentle sine wave animation
        static double phase = 0.0;
        phase += 0.05;
        
        m_bassLevel = (qSin(phase) + 1.0) / 2.0 * 0.3;
        m_midLevel = (qSin(phase * 1.5) + 1.0) / 2.0 * 0.2;
        m_trebleLevel = (qSin(phase * 2.0) + 1.0) / 2.0 * 0.15;
        m_overallLevel = (m_bassLevel + m_midLevel + m_trebleLevel) / 3.0;
        
        emit audioLevelsChanged();
        updateColors();
        return;
    }
    
    // Read audio data
    QByteArray audioData = m_audioDevice->readAll();
    
    if (audioData.isEmpty()) {
        return;
    }
    
    // Simple audio level detection (RMS)
    const qint16 *samples = reinterpret_cast<const qint16*>(audioData.constData());
    int sampleCount = audioData.size() / sizeof(qint16);
    
    double sum = 0.0;
    for (int i = 0; i < sampleCount; ++i) {
        double normalized = samples[i] / 32768.0;
        sum += normalized * normalized;
    }
    
    double rms = qSqrt(sum / sampleCount);
    
    // Simulate frequency bands (in real FFT, analyze specific frequency ranges)
    m_bassLevel = rms * 1.2 * m_sensitivity;      // Bass (boost)
    m_midLevel = rms * 1.0 * m_sensitivity;       // Mid (normal)
    m_trebleLevel = rms * 0.8 * m_sensitivity;    // Treble (reduce)
    m_overallLevel = rms * m_sensitivity;
    
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
