## 1. Context Compression Integration

- [ ] 1.1 Review existing context_compression.rs implementation
- [ ] 1.2 Integrate compression into runtime_session.rs message flow
- [ ] 1.3 Implement compression trigger check before LLM calls

## 2. Summary Generation

- [ ] 2.1 Implement conversation round summarization logic
- [ ] 2.2 Design summary prompt for LLM
- [ ] 2.3 Implement [[SUMMARY]] marker format
- [ ] 2.4 Implement layered compression (recent 10 rounds intact)

## 3. Entity Preservation

- [ ] 3.1 Implement entity extraction (person, date, amount, technical terms)
- [ ] 3.2 Implement entity marker format [type:value]
- [ ] 3.3 Implement entity re-injection after compression

## 4. Frontend Integration

- [ ] 4.1 Add "Compress Context" button to UI
- [ ] 4.2 Add Ctrl+Shift+C keyboard shortcut
- [ ] 4.3 Display compression status indicator
- [ ] 4.4 Add toast notification on compression complete
- [ ] 4.5 Create useContextCompression hook

## 5. Configuration and Tuning

- [ ] 5.1 Make threshold configurable (messages, tokens)
- [ ] 5.2 Tune compression ratio for quality
- [ ] 5.3 Test various conversation lengths
- [ ] 5.4 Verify LLM quality with compressed context
