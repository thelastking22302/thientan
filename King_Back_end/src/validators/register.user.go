package validators

import (
	"regexp"
	"strings"

	"github.com/go-playground/validator/v10"
)

func RegisterCustomValidations(v *validator.Validate) {

	v.RegisterValidation("thientan_email", func(fl validator.FieldLevel) bool {
		email := fl.Field().String()
		return strings.HasSuffix(email, "@thientan.com")
	})

	v.RegisterValidation("secure_password", func(fl validator.FieldLevel) bool {
		password := fl.Field().String()
		if len(password) < 8 {
			return false
		}

		hasUpper := regexp.MustCompile(`[A-Z]`).MatchString(password)
		hasNumber := regexp.MustCompile(`[0-9]`).MatchString(password)
		hasSpecial := regexp.MustCompile(`[!@#~$%^&*()_+|<>?{}\[\]\\\/]`).MatchString(password)

		return hasUpper && hasNumber && hasSpecial
	})
}
