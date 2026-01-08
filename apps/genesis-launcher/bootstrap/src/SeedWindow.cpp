/**
 * SeedWindow Implementation
 */

#include "SeedWindow.h"

#include <QPainter>
#include <QVBoxLayout>
#include <QMouseEvent>
#include <QGraphicsDropShadowEffect>
#include <QMessageBox>

SeedWindow::SeedWindow(QWidget *parent)
    : QWidget(parent, Qt::FramelessWindowHint | Qt::WindowStaysOnTopHint)
{
    setAttribute(Qt::WA_TranslucentBackground);
    setFixedSize(400, 200);
    
    // Center on screen
    move((screen()->geometry().width() - width()) / 2,
         (screen()->geometry().height() - height()) / 2);
    
    // Layout
    QVBoxLayout *layout = new QVBoxLayout(this);
    layout->setContentsMargins(30, 30, 30, 30);
    layout->setSpacing(15);
    
    // Logo/Title
    m_logoLabel = new QLabel("GENESIS", this);
    m_logoLabel->setStyleSheet(
        "font-family: 'Segoe UI', Arial; "
        "font-size: 28px; "
        "font-weight: bold; "
        "color: #E0E0E0;"
    );
    m_logoLabel->setAlignment(Qt::AlignCenter);
    layout->addWidget(m_logoLabel);
    
    // Status label
    m_statusLabel = new QLabel("Initializing...", this);
    m_statusLabel->setStyleSheet(
        "font-family: 'Segoe UI', Arial; "
        "font-size: 12px; "
        "color: #7A7A7A;"
    );
    m_statusLabel->setAlignment(Qt::AlignCenter);
    layout->addWidget(m_statusLabel);
    
    // Progress bar
    m_progressBar = new QProgressBar(this);
    m_progressBar->setRange(0, 100);
    m_progressBar->setValue(0);
    m_progressBar->setTextVisible(false);
    m_progressBar->setStyleSheet(
        "QProgressBar {"
        "    background-color: #1A1A1A;"
        "    border: none;"
        "    border-radius: 4px;"
        "    height: 8px;"
        "}"
        "QProgressBar::chunk {"
        "    background: qlineargradient(x1:0, y1:0, x2:1, y2:0, "
        "        stop:0 #FF3D00, stop:1 #FF9100);"
        "    border-radius: 4px;"
        "}"
    );
    layout->addWidget(m_progressBar);
    
    layout->addStretch();
}

void SeedWindow::setProgress(double percent)
{
    m_progressBar->setValue(static_cast<int>(percent));
}

void SeedWindow::setStatus(const QString &message)
{
    m_statusLabel->setText(message);
}

void SeedWindow::showError(const QString &error)
{
    QMessageBox::critical(this, "Download Error", error);
    close();
}

void SeedWindow::paintEvent(QPaintEvent *)
{
    QPainter painter(this);
    painter.setRenderHint(QPainter::Antialiasing);
    
    // Draw shadow
    QColor shadowColor(0, 0, 0, 100);
    for (int i = 0; i < 10; ++i) {
        painter.setPen(Qt::NoPen);
        painter.setBrush(QColor(0, 0, 0, 10 - i));
        painter.drawRoundedRect(rect().adjusted(i, i, -i, -i), 16, 16);
    }
    
    // Draw main background
    painter.setBrush(QColor("#050505"));
    painter.setPen(QColor("#202020"));
    painter.drawRoundedRect(rect().adjusted(10, 10, -10, -10), 16, 16);
}

void SeedWindow::mousePressEvent(QMouseEvent *event)
{
    if (event->button() == Qt::LeftButton) {
        m_dragPosition = event->globalPosition().toPoint() - frameGeometry().topLeft();
        event->accept();
    }
}

void SeedWindow::mouseMoveEvent(QMouseEvent *event)
{
    if (event->buttons() & Qt::LeftButton) {
        move(event->globalPosition().toPoint() - m_dragPosition);
        event->accept();
    }
}
