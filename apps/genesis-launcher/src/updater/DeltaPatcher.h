/**
 * DeltaPatcher - Binary Delta Patching
 * 
 * Applies binary diffs to update files efficiently.
 */

#ifndef GENESIS_DELTA_PATCHER_H
#define GENESIS_DELTA_PATCHER_H

#include <QString>

class DeltaPatcher
{
public:
    /**
     * Apply a delta patch to create a new file
     * @param oldFile Path to the original file
     * @param deltaFile Path to the delta/patch file
     * @param newFile Path for the output file
     * @return true on success
     */
    static bool applyPatch(const QString &oldFile, 
                           const QString &deltaFile,
                           const QString &newFile);
    
    /**
     * Create a delta patch between two files
     * @param oldFile Original file
     * @param newFile Updated file
     * @param deltaFile Output delta file
     * @return true on success
     */
    static bool createPatch(const QString &oldFile,
                            const QString &newFile,
                            const QString &deltaFile);
};

#endif // GENESIS_DELTA_PATCHER_H
