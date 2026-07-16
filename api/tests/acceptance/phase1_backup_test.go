package acceptance

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/crypto"
)

func TestAcceptance_BackupEncryptDecrypt_Roundtrip(t *testing.T) {
	err := crypto.Init("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef")
	require.NoError(t, err, "crypto.Init should succeed")
	require.True(t, crypto.Initialized(), "crypto should be initialized")

	tmpDir := t.TempDir()
	srcPath := filepath.Join(tmpDir, "test_backup.dump")
	encPath := filepath.Join(tmpDir, "test_backup.dump.enc")
	decPath := filepath.Join(tmpDir, "test_backup_decrypted.dump")

	testData := []byte("This is a simulated PostgreSQL backup dump file content.\n" +
		"PGDMP\x00\x00\x00\x00 some binary data follows...\n" +
		"CREATE TABLE test (id UUID PRIMARY KEY);\n" +
		"COPY test FROM stdin;\n")
	for i := 0; i < 1000; i++ {
		testData = append(testData, []byte("row data payload that simulates a real backup file content\n")...)
	}
	err = os.WriteFile(srcPath, testData, 0644)
	require.NoError(t, err, "writing test source file")

	t.Logf("Step 1: Created test backup file (%d bytes)", len(testData))

	err = crypto.EncryptFile(srcPath, encPath)
	require.NoError(t, err, "EncryptFile should succeed")

	encData, err := os.ReadFile(encPath)
	require.NoError(t, err)
	assert.NotEqual(t, testData, encData, "encrypted content should differ from plaintext")
	assert.Greater(t, len(encData), len(testData), "encrypted file should be larger due to nonce+auth overhead")
	t.Logf("Step 2: Encrypted backup file (%d bytes, %d%% overhead)", len(encData), (len(encData)-len(testData))*100/len(testData))

	err = crypto.DecryptFile(encPath, decPath)
	require.NoError(t, err, "DecryptFile should succeed")

	decData, err := os.ReadFile(decPath)
	require.NoError(t, err)
	assert.Equal(t, testData, decData, "decrypted content should match original")
	t.Log("Step 3: Decrypted backup matches original exactly")
}

func TestAcceptance_BackupEncrypt_LargeFile(t *testing.T) {
	err := crypto.Init("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef")
	require.NoError(t, err)

	tmpDir := t.TempDir()
	srcPath := filepath.Join(tmpDir, "large_backup.dump")
	encPath := filepath.Join(tmpDir, "large_backup.dump.enc")
	decPath := filepath.Join(tmpDir, "large_backup_dec.dump")

	file, err := os.Create(srcPath)
	require.NoError(t, err)
	chunk := make([]byte, 64*1024)
	for i := range chunk {
		chunk[i] = byte(i % 256)
	}
	for i := 0; i < 200; i++ {
		file.Write(chunk)
	}
	file.Close()
	t.Log("Step 1: Created 12.5MB test file")

	err = crypto.EncryptFile(srcPath, encPath)
	require.NoError(t, err, "EncryptFile for large file should succeed")

	err = crypto.DecryptFile(encPath, decPath)
	require.NoError(t, err, "DecryptFile for large file should succeed")

	srcInfo, _ := os.Stat(srcPath)
	decInfo, _ := os.Stat(decPath)
	assert.Equal(t, srcInfo.Size(), decInfo.Size(), "decrypted file size should match original")

	srcBytes, _ := os.ReadFile(srcPath)
	decBytes, _ := os.ReadFile(decPath)
	assert.Equal(t, srcBytes, decBytes, "decrypted content should match original")
	t.Log("Step 2: Large file encrypt/decrypt roundtrip verified")
}

func TestAcceptance_BackupEncrypt_CorruptedFileFails(t *testing.T) {
	err := crypto.Init("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef")
	require.NoError(t, err)

	tmpDir := t.TempDir()
	corruptedPath := filepath.Join(tmpDir, "corrupted.enc")
	decPath := filepath.Join(tmpDir, "corrupted_dec.dump")

	corruptedData := []byte("this is not a valid encrypted file at all")
	os.WriteFile(corruptedPath, corruptedData, 0644)

	err = crypto.DecryptFile(corruptedPath, decPath)
	assert.Error(t, err, "decrypting corrupted file should fail")
	t.Log("Step 3: Corrupted encrypted file correctly rejected")
}

func TestAcceptance_BackupEncrypt_WrongKeyFails(t *testing.T) {
	err := crypto.Init("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef")
	require.NoError(t, err)

	tmpDir := t.TempDir()
	srcPath := filepath.Join(tmpDir, "test.dump")
	encPath := filepath.Join(tmpDir, "test.dump.enc")
	decPath := filepath.Join(tmpDir, "test_dec.dump")

	os.WriteFile(srcPath, []byte("sensitive backup data"), 0644)
	crypto.EncryptFile(srcPath, encPath)

	crypto.Init("fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210")

	err = crypto.DecryptFile(encPath, decPath)
	assert.Error(t, err, "decrypting with wrong key should fail")
	t.Log("Step 4: Wrong key correctly rejected during decryption")
}

func TestAcceptance_BackupEncrypt_UninitializedFails(t *testing.T) {
	tmpDir := t.TempDir()
	srcPath := filepath.Join(tmpDir, "test.dump")
	dstPath := filepath.Join(tmpDir, "test.dump.enc")
	os.WriteFile(srcPath, []byte("test"), 0644)

	origInit := crypto.Initialized()
	if !origInit {
		err := crypto.EncryptFile(srcPath, dstPath)
		assert.Error(t, err, "EncryptFile should fail when crypto not initialized")
		t.Log("Step 5: Uninitialized crypto correctly rejected")
	}
}
