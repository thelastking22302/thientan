package req_users

type RequestSignIn struct {
	Account  string `json:"account" gorm:"column:account;" validate:"required,thientan_email"`
	Password string `json:"password_user" gorm:"column:password_user;" validate:"required,secure_password"`
}
