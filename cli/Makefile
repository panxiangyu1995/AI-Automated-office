BINARY_NAME=ao-cli
OUTPUT_DIR=bin

build:
	go build -o $(OUTPUT_DIR)/$(BINARY_NAME) main.go

build-linux:
	GOOS=linux GOARCH=amd64 go build -o $(OUTPUT_DIR)/$(BINARY_NAME)-linux-amd64 main.go

build-darwin:
	GOOS=darwin GOARCH=amd64 go build -o $(OUTPUT_DIR)/$(BINARY_NAME)-darwin-amd64 main.go
	GOOS=darwin GOARCH=arm64 go build -o $(OUTPUT_DIR)/$(BINARY_NAME)-darwin-arm64 main.go

build-windows:
	GOOS=windows GOARCH=amd64 go build -o $(OUTPUT_DIR)/$(BINARY_NAME)-windows-amd64.exe main.go

build-all: build-linux build-darwin build-windows

clean:
	rm -rf $(OUTPUT_DIR)/*

.PHONY: build build-linux build-darwin build-windows build-all clean
