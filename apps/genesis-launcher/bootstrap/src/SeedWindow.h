/**
 * SeedWindow - Bootstrap Installer UI
 * 
 * A sleek, frameless window showing download progress.
 */

#ifndef SEED_WINDOW_H
#define SEED_WINDOW_H

#include <QWidget>
#include <QLabel>
#include <QProgressBar>

class SeedWindow : public QWidget
{
    Q_OBJECT

public:
    explicit SeedWindow(QWidget *parent = nullptr);
    
public slots:
    void setProgress(double percent);
    void setStatus(const QString &message);
    void showError(const QString &error);

protected:
    void paintEvent(QPaintEvent *event) override;
    void mousePressEvent(QMouseEvent *event) override;
    void mouseMoveEvent(QMouseEvent *event) override;

private:
    QLabel *m_logoLabel;
    QLabel *m_statusLabel;
    QProgressBar *m_progressBar;
    QPoint m_dragPosition;
};

#endif // SEED_WINDOW_H
