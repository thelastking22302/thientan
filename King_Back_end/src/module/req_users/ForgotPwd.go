package req_users

type ForgorPwd struct {
	Account         string `json:"account" gorm:"column:account;" validate:"required,thientan_email"`
	NewPassword     string `json:"new_password" validate:"required,secure_password"`
	ConfirmPassword string `json:"confirm_password" validate:"required,eqfield=NewPassword,secure_password"`
}
