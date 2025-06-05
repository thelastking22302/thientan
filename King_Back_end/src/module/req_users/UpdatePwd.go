package req_users

type RequestUpdatePassword struct {
	OldPassword     string `json:"old_password" validate:"required,secure_password"`
	NewPassword     string `json:"new_password" validate:"required,secure_password"`
	ConfirmPassword string `json:"confirm_password" validate:"required,eqfield=NewPassword,secure_password"`
}
