package olog

import (
	"compress/gzip"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"
)

func ArchiveOldLogs(logDir string, retentionDays int) error {
	if logDir == "" {
		logDir = LogDir()
	}
	if logDir == "" {
		return fmt.Errorf("cannot determine log directory")
	}
	if retentionDays < 1 {
		retentionDays = 30
	}

	archiveDir := filepath.Join(logDir, "archive")
	if err := os.MkdirAll(archiveDir, 0755); err != nil {
		return fmt.Errorf("cannot create archive directory: %w", err)
	}

	cutoff := time.Now().AddDate(0, 0, -retentionDays)

	entries, err := os.ReadDir(logDir)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return fmt.Errorf("cannot read log directory: %w", err)
	}

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		if filepath.Ext(entry.Name()) != ".jsonl" {
			continue
		}

		info, err := entry.Info()
		if err != nil {
			continue
		}

		if info.ModTime().Before(cutoff) {
			srcPath := filepath.Join(logDir, entry.Name())
			dstPath := filepath.Join(archiveDir, entry.Name()+".gz")

			if err := compressFile(srcPath, dstPath); err != nil {
				return fmt.Errorf("cannot compress %s: %w", entry.Name(), err)
			}

			if err := os.Remove(srcPath); err != nil {
				return fmt.Errorf("cannot remove original %s: %w", entry.Name(), err)
			}
		}
	}

	deleteCutoff := time.Now().AddDate(0, 0, -retentionDays*2)
	archiveEntries, err := os.ReadDir(archiveDir)
	if err != nil {
		return nil
	}

	for _, entry := range archiveEntries {
		if entry.IsDir() {
			continue
		}

		info, err := entry.Info()
		if err != nil {
			continue
		}

		if info.ModTime().Before(deleteCutoff) {
			archivePath := filepath.Join(archiveDir, entry.Name())
			if err := os.Remove(archivePath); err != nil {
				return fmt.Errorf("cannot remove archived %s: %w", entry.Name(), err)
			}
		}
	}

	return nil
}

func compressFile(srcPath, dstPath string) error {
	srcFile, err := os.Open(srcPath)
	if err != nil {
		return err
	}
	defer srcFile.Close()

	dstFile, err := os.Create(dstPath)
	if err != nil {
		return err
	}
	defer dstFile.Close()

	gzWriter := gzip.NewWriter(dstFile)
	defer gzWriter.Close()

	if _, err := io.Copy(gzWriter, srcFile); err != nil {
		return err
	}
	return gzWriter.Close()
}
