/**
 * DeltaPatcher Implementation
 * 
 * Simple delta patching - in production use bsdiff/bspatch or similar
 */

#include "DeltaPatcher.h"

#include <QFile>
#include <QDataStream>
#include <QDebug>

bool DeltaPatcher::applyPatch(const QString &oldFile,
                               const QString &deltaFile,
                               const QString &newFile)
{
    // Simple patch format: 
    // [magic][new_size][chunk_count]
    // For each chunk: [offset][length][data or reference]
    
    QFile delta(deltaFile);
    if (!delta.open(QIODevice::ReadOnly)) {
        qWarning() << "Cannot open delta file:" << deltaFile;
        return false;
    }
    
    QFile old(oldFile);
    if (!old.open(QIODevice::ReadOnly)) {
        qWarning() << "Cannot open old file:" << oldFile;
        return false;
    }
    
    QFile output(newFile);
    if (!output.open(QIODevice::WriteOnly)) {
        qWarning() << "Cannot create output file:" << newFile;
        return false;
    }
    
    QDataStream deltaStream(&delta);
    QByteArray oldData = old.readAll();
    old.close();
    
    // Read header
    quint32 magic;
    deltaStream >> magic;
    
    if (magic != 0x44454C54) {  // "DELT"
        // Not a delta file - just copy it
        delta.seek(0);
        output.write(delta.readAll());
        delta.close();
        output.close();
        return true;
    }
    
    quint64 newSize;
    quint32 chunkCount;
    deltaStream >> newSize >> chunkCount;
    
    QByteArray newData;
    newData.reserve(newSize);
    
    for (quint32 i = 0; i < chunkCount; ++i) {
        quint8 chunkType;
        deltaStream >> chunkType;
        
        if (chunkType == 0) {
            // Reference to old file
            quint64 offset, length;
            deltaStream >> offset >> length;
            newData.append(oldData.mid(offset, length));
        } else {
            // New data
            quint32 length;
            deltaStream >> length;
            QByteArray data;
            data.resize(length);
            deltaStream.readRawData(data.data(), length);
            newData.append(data);
        }
    }
    
    output.write(newData);
    
    delta.close();
    output.close();
    
    return true;
}

bool DeltaPatcher::createPatch(const QString &oldFile,
                                const QString &newFile,
                                const QString &deltaFile)
{
    // Simplified patch creation
    // For production, use a proper diff algorithm (bsdiff, etc.)
    
    QFile oldF(oldFile);
    QFile newF(newFile);
    
    if (!oldF.open(QIODevice::ReadOnly) || !newF.open(QIODevice::ReadOnly)) {
        return false;
    }
    
    QByteArray oldData = oldF.readAll();
    QByteArray newData = newF.readAll();
    oldF.close();
    newF.close();
    
    // If files are very different, just store the new file
    if (oldData.size() == 0 || 
        qAbs(oldData.size() - newData.size()) > oldData.size() / 2) {
        return QFile::copy(newFile, deltaFile);
    }
    
    QFile delta(deltaFile);
    if (!delta.open(QIODevice::WriteOnly)) {
        return false;
    }
    
    QDataStream stream(&delta);
    
    // Write header
    stream << quint32(0x44454C54);  // "DELT"
    stream << quint64(newData.size());
    stream << quint32(1);  // Single chunk for simplicity
    
    // Write new data as a single chunk
    stream << quint8(1);  // New data chunk
    stream << quint32(newData.size());
    stream.writeRawData(newData.constData(), newData.size());
    
    delta.close();
    return true;
}
