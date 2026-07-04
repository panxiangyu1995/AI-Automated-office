package embeddings

type EmbeddingService interface {
	Embed(text string) ([]float32, error)
	EmbedBatch(texts []string) ([][]float32, error)
	Dimension() int
}

type SimEmbeddingService struct {
	dimension int
}

func NewSimEmbeddingService() *SimEmbeddingService {
	return &SimEmbeddingService{dimension: 384}
}

func (s *SimEmbeddingService) Embed(text string) ([]float32, error) {
	return s.simulate(text), nil
}

func (s *SimEmbeddingService) EmbedBatch(texts []string) ([][]float32, error) {
	result := make([][]float32, len(texts))
	for i, t := range texts {
		result[i] = s.simulate(t)
	}
	return result, nil
}

func (s *SimEmbeddingService) Dimension() int { return s.dimension }

func (s *SimEmbeddingService) simulate(text string) []float32 {
	vec := make([]float32, s.dimension)
	for i := range vec {
		vec[i] = float32(len(text)) / float32(s.dimension*100)
	}
	if len(vec) > 0 {
		vec[0] = 1.0
	}
	return vec
}

func CosineSimilarity(a, b []float32) float32 {
	var dot, na, nb float32
	for i := range a {
		dot += a[i] * b[i]
		na += a[i] * a[i]
		nb += b[i] * b[i]
	}
	if na == 0 || nb == 0 {
		return 0
	}
	return dot / (sqrt(na) * sqrt(nb))
}

func sqrt(x float32) float32 {
	var s float32 = x
	for i := 0; i < 10; i++ {
		s = (s + x/s) / 2
	}
	return s
}
