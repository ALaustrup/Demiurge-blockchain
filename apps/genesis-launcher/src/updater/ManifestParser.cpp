/**
 * ManifestParser Implementation
 */

#include "ManifestParser.h"

#include <QCoreApplication>
#include <QFile>

QString getCurrentVersion(const QString &component)
{
    if (component == "GenesisLauncher") {
        return QString(APP_VERSION);
    }
    
    QString versionFile = QCoreApplication::applicationDirPath() + "/" + 
                          component + ".version";
    QFile file(versionFile);
    if (file.open(QIODevice::ReadOnly)) {
        QString version = QString::fromUtf8(file.readAll()).trimmed();
        file.close();
        return version;
    }
    
    return "0.0.0";
}
