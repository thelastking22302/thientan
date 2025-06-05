package common

type Paggings struct {
	Limit int   `json:"limit" form:"limit"`
	Page  int   `json:"page" form:"page"`
	Total int64 `json:"total" form:"-"`
}

func (p *Paggings) Process() {
	if p.Page <= 0 {
		p.Page = 1
	}
	if p.Limit < 1 || p.Limit >= 100 {
		p.Limit = 10
	}
}
