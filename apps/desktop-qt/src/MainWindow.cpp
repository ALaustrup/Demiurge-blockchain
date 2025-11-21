#include "MainWindow.h"
#include <QVBoxLayout>
#include <QWidget>

MainWindow::MainWindow(QWidget *parent)
    : QMainWindow(parent)
    , m_centralLabel(nullptr)
{
    setWindowTitle("DEMIURGE - Pantheon Console");
    resize(800, 600);
    
    // Create central widget and layout
    QWidget *centralWidget = new QWidget(this);
    QVBoxLayout *layout = new QVBoxLayout(centralWidget);
    
    // Create label
    m_centralLabel = new QLabel("Demiurge – Pantheon Console", this);
    m_centralLabel->setAlignment(Qt::AlignCenter);
    m_centralLabel->setStyleSheet(
        "QLabel {"
        "font-size: 24px;"
        "font-weight: bold;"
        "color: #e4e4e7;"
        "background-color: #18181b;"
        "padding: 20px;"
        "border-radius: 8px;"
        "}"
    );
    
    layout->addWidget(m_centralLabel);
    layout->setAlignment(Qt::AlignCenter);
    
    centralWidget->setLayout(layout);
    setCentralWidget(centralWidget);
    
    // Set window style
    setStyleSheet(
        "QMainWindow {"
        "background-color: #09090b;"
        "}"
    );
}

MainWindow::~MainWindow()
{
}

