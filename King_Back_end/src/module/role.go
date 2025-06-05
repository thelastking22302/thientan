package module

type Roles int

const (
	MEMBERS Roles = iota
	ADMIN
	ROOT
)

func (r Roles) String() string {
	return []string{"MEMBERS", "ADMIN", "ROOT"}[r]
}
