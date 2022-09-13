


data "aws_vpc" "vpc" {
  tags = {
    Name = "terraform-vpc-${var.environment}"
  }
}

data "aws_subnet" "subnet" {
  vpc_id            = data.aws_vpc.vpc.id
  availability_zone = var.availability_zone

  tags = {
    Public = "1"
  }
}


resource "aws_security_group" "security_group" {
  name   = "terraform-security-group-${var.environment}"
  vpc_id = data.aws_vpc.vpc.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port = 0
    to_port   = 0
    protocol  = "-1"
    self      = true
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

data "aws_ami" "ubuntu" {
  most_recent = true

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  owners = ["099720109477"]
}

resource "aws_instance" "instance" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.small"

  subnet_id              = data.aws_subnet.subnet.id
  vpc_security_group_ids = [aws_security_group.security_group.id]
  key_name               = aws_key_pair.keypair.id

  tags = {
    Terraform = true
    Name      = "terraform-ec2-${var.environment}"
  }

}

resource "aws_key_pair" "keypair" {
  key_name   = "terraform-demo"
  public_key = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJ8sJK6k6pjPnBj2v9xCjke9P8kWSBhssDqP0lrDww/C tangjirouboi@gmail.com"
}


output "ip" {
  value = aws_instance.instance.public_ip
}


