package parser

import (
	"fmt"
	"io"
	"strings"

	"github.com/xuri/excelize/v2"
)

// ExcelParser Excel 文件解析器
type ExcelParser struct {
	fieldMapper *FieldMapper
}

// NewExcelParser 创建 Excel 解析器
func NewExcelParser() *ExcelParser {
	return &ExcelParser{
		fieldMapper: NewFieldMapper(),
	}
}

// ParseResult 解析结果
type ParseResult struct {
	Headers []string
	Rows    []ParsedRow
	Errors  []ParseError
}

// ParsedRow 解析后的行
type ParsedRow struct {
	RowNumber int
	RawData   map[string]string
	Fields    map[string]string
}

// ParseError 解析错误
type ParseError struct {
	RowNumber int
	Field     string
	Message   string
}

// Parse 解析 Excel 文件
func (p *ExcelParser) Parse(reader io.Reader) (*ParseResult, error) {
	f, err := excelize.OpenReader(reader)
	if err != nil {
		return nil, fmt.Errorf("failed to open excel file: %w", err)
	}
	defer f.Close()

	// 获取第一个工作表
	sheetName := f.GetSheetName(0)
	if sheetName == "" {
		return nil, fmt.Errorf("no sheet found in excel file")
	}

	rows, err := f.GetRows(sheetName)
	if err != nil {
		return nil, fmt.Errorf("failed to get rows: %w", err)
	}

	if len(rows) == 0 {
		return nil, fmt.Errorf("excel file is empty")
	}

	result := &ParseResult{
		Headers: make([]string, 0),
		Rows:    make([]ParsedRow, 0),
		Errors:  make([]ParseError, 0),
	}

	// 解析表头
	headerRow := rows[0]
	for i, cell := range headerRow {
		header := strings.TrimSpace(cell)
		if header == "" {
			header = fmt.Sprintf("column_%d", i+1)
		}
		result.Headers = append(result.Headers, header)
	}

	// 解析数据行
	for i := 1; i < len(rows); i++ {
		row := rows[i]
		rowNumber := i + 1 // Excel 行号从 1 开始

		parsedRow := ParsedRow{
			RowNumber: rowNumber,
			RawData:   make(map[string]string),
			Fields:    make(map[string]string),
		}

		// 解析每列
		for j, cell := range row {
			if j >= len(result.Headers) {
				break
			}
			header := result.Headers[j]
			value := strings.TrimSpace(cell)
			parsedRow.RawData[header] = value

			// 映射到标准字段
			fieldName := p.fieldMapper.MapHeaderToField(header)
			if fieldName != "" {
				parsedRow.Fields[fieldName] = value
			}
		}

		result.Rows = append(result.Rows, parsedRow)
	}

	return result, nil
}

// ValidateRow 验证行数据
func (p *ExcelParser) ValidateRow(row ParsedRow) []ParseError {
	errors := make([]ParseError, 0)

	// 必填字段验证
	requiredFields := []string{"username", "name"}
	for _, field := range requiredFields {
		if row.Fields[field] == "" {
			errors = append(errors, ParseError{
				RowNumber: row.RowNumber,
				Field:     field,
				Message:   fmt.Sprintf("%s is required", field),
			})
		}
	}

	// 用户名格式验证
	if username := row.Fields["username"]; username != "" {
		if len(username) < 3 || len(username) > 50 {
			errors = append(errors, ParseError{
				RowNumber: row.RowNumber,
				Field:     "username",
				Message:   "username must be between 3 and 50 characters",
			})
		}
	}

	// 邮箱格式验证
	if email := row.Fields["email"]; email != "" {
		if !strings.Contains(email, "@") {
			errors = append(errors, ParseError{
				RowNumber: row.RowNumber,
				Field:     "email",
				Message:   "invalid email format",
			})
		}
	}

	return errors
}
