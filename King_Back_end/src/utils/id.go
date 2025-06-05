package utils

import (
	"errors"

	"github.com/google/uuid"
)

func GenerateUUID() (string, error) {
	id, err := uuid.NewUUID()
	if err != nil {
		return "", errors.New("failed to generate UUID: " + err.Error())
	}
	return id.String(), nil
}
