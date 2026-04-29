terraform {
  required_version = ">= 1.10.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }

    random = {
      source  = "hashicorp/random"
      version = "~> 3.8"
    }

    external = {
      source  = "hashicorp/external"
      version = "~> 2.3"
    }
  }

  backend "s3" {
    bucket = "e-commerce-terraform-state-maciejpvp"
    region = "eu-central-1"
  }
}

provider "aws" {
  region = "eu-central-1"
}

provider "random" {
}
