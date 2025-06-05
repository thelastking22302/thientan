package validators

import "regexp"

func IsValidUsername(username string) bool {
	regex := regexp.MustCompile(`^[a-zA-Z0-9_]{3,20}$`)
	return regex.MatchString(username)
}
