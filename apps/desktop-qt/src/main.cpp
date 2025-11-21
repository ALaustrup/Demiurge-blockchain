#include <QApplication>
#include "MainWindow.h"

int main(int argc, char *argv[])
{
    QApplication app(argc, argv);
    
    app.setApplicationName("Pantheon Console");
    app.setApplicationVersion("0.1.0");
    app.setOrganizationName("DEMIURGE");
    
    MainWindow window;
    window.show();
    
    return app.exec();
}

